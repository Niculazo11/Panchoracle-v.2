// Business logic for the student's game state (UN-301): adopt, buy and equip.
// Ports the rules of src/state/actions/pancho.js and shop.js, with the server as the source
// of truth. Every write is a single atomic update guarded by its own preconditions, so a
// failed request never changes anything (ADR 6.10).
import AppError from "../utils/AppError.js";
import { Assignment, Classroom, Cosmetic, MinigamePlay, Pet, Submission } from "../models/index.js";
import {
  DEFAULT_ASSIGNMENT,
  MINIGAME_MAX_COINS_PER_PLAY,
  SLOTS,
  SLOT_BY_CATEGORY,
  STEP_LABELS,
  minigameLimits,
} from "../config/game.js";
import { clock } from "../utils/clock.js";
import { reconcilePet } from "./petStateService.js";

function buildSteps(completed = []) {
  return STEP_LABELS.map((label, index) => ({ id: index + 1, label, completed: completed[index] === true }));
}

// Only a student that joined a classroom has a Pancho (created on join, ADR 8.4).
async function getPet(user) {
  const pet = await Pet.findOne({ ownerId: user._id });
  if (!pet) throw new AppError(404, "NOT_FOUND", "You do not have a Pancho yet: join a classroom first");
  return pet;
}

// ADR 5.3: the active assignment is the first one (by dueAt) the student has not submitted,
// with dueAt in the future and the period already started. Falls back to the default task.
export async function getCurrentAssignment(user, classroom, pet) {
  let active = null;
  const now = clock.now();
  if (classroom && now >= classroom.period.startDate.getTime()) {
    const assignments = await Assignment.find({
      classroomId: classroom._id,
      periodId: classroom.period.periodId,
      dueAt: { $gt: new Date(now) },
    }).sort({ dueAt: 1 });
    const submitted = await Submission.find({
      studentId: user._id,
      assignmentId: { $in: assignments.map((item) => item._id) },
    }).select("assignmentId");
    const done = new Set(submitted.map((item) => item.assignmentId.toString()));
    active = assignments.find((item) => !done.has(item._id.toString())) || null;
  }
  const task = active
    ? { id: active._id.toString(), title: active.title, description: active.description, dueAt: active.dueAt }
    : { ...DEFAULT_ASSIGNMENT };
  // Step progress only counts if it was made on THIS assignment.
  const progress = pet && pet.currentAssignmentStepsFor === task.id ? pet.currentAssignmentSteps : [];
  return { ...task, steps: buildSteps(progress) };
}

// Same shape the client keeps in useGameState() (src/state/defaults.js), so UN-303 can swap
// localStorage for this response. The client writes status as "ALIVE" / "DEAD".
// Health, hunger and status are reconciled with the server clock on every read AND after
// every change (UN-108, ADR 5.3), so the response always reflects the current moment.
export async function toGameJson(user, storedPet) {
  const classroom = user.classroomId ? await Classroom.findById(user.classroomId) : null;
  const pet = await reconcilePet(classroom, storedPet);
  return {
    student: {
      id: user.username || user.name,
      userId: user._id.toString(),
      coins: pet.coins,
      inventory: [...pet.inventory],
      assignmentsCompleted: await Submission.countDocuments({ studentId: user._id }),
    },
    dog: {
      id: pet.panchoId,
      name: pet.name,
      imgUrl: pet.imgUrl,
      health: pet.health,
      hunger: pet.hunger,
      status: pet.status.toUpperCase(),
      equippedCosmetics: Object.fromEntries(SLOTS.map((slot) => [slot, pet.equipped[slot] ?? null])),
    },
    currentAssignment: await getCurrentAssignment(user, classroom, pet),
  };
}

// Reconciled Pancho + active assignment of a student, for the step/submit endpoints (UN-302).
export async function loadStudentContext(user) {
  const stored = await getPet(user);
  const classroom = user.classroomId ? await Classroom.findById(user.classroomId) : null;
  const pet = await reconcilePet(classroom, stored);
  return { pet, assignment: await getCurrentAssignment(user, classroom, pet) };
}

// GET /api/me/game
export async function getGameState(user) {
  return toGameJson(user, await getPet(user));
}

// GET /api/cosmetics: the catalog comes from MongoDB, with the client's field names.
export async function listCosmetics() {
  const cosmetics = await Cosmetic.find().sort({ cosmeticId: 1 });
  return cosmetics.map((item) => ({
    id: item.cosmeticId,
    name: item.name,
    category: item.category,
    cost: item.cost,
    image: item.image,
  }));
}

// PUT /api/pets/me/pancho: stores which dog the student adopted.
// Unlike the client's choosePancho, this NEVER touches health, hunger or status: a new Pancho
// already starts at 100/100 (created on join), and resetting them here would be a hidden
// "revive" and a way to heal (ADR 5.3 and 5.4: no revive exists).
export async function choosePancho(user, { panchoId, imgUrl }) {
  await getPet(user);
  const pet = await Pet.findOneAndUpdate(
    { ownerId: user._id },
    { $set: { panchoId, imgUrl } },
    { returnDocument: "after" }
  );
  return toGameJson(user, pet);
}

// POST /api/pets/me/inventory. Exists in the catalog, not owned, enough coins; one atomic
// update (ADR 6.10): the filter holds the preconditions, so two simultaneous requests can
// neither spend the same coins twice nor buy the same cosmetic twice.
export async function buyCosmetic(user, cosmeticId) {
  const cosmetic = await Cosmetic.findOne({ cosmeticId });
  if (!cosmetic) throw new AppError(404, "NOT_FOUND", "That cosmetic does not exist");

  const pet = await Pet.findOneAndUpdate(
    { ownerId: user._id, coins: { $gte: cosmetic.cost }, inventory: { $ne: cosmeticId } },
    { $inc: { coins: -cosmetic.cost }, $push: { inventory: cosmeticId } },
    { returnDocument: "after" }
  );
  if (pet) return toGameJson(user, pet);

  // Nothing changed: find out why (same order and messages as the client's buyCosmetic).
  const current = await getPet(user);
  if (current.inventory.includes(cosmeticId)) {
    throw new AppError(409, "CONFLICT", "You already own that cosmetic.");
  }
  throw new AppError(409, "CONFLICT", "Not enough coins.");
}

// PUT /api/pets/me/equipped. Validates every slot before writing, so a bad slot changes
// nothing. A cosmetic must be owned and its category must match the slot (ADR 6.11).
export async function equipCosmetics(user, slots) {
  const pet = await getPet(user);
  const changes = Object.entries(slots).filter(([, id]) => id !== undefined);
  const ids = changes.map(([, id]) => id).filter((id) => id !== null);

  const cosmetics = await Cosmetic.find({ cosmeticId: { $in: ids } });
  const byId = new Map(cosmetics.map((item) => [item.cosmeticId, item]));

  for (const [slot, id] of changes) {
    if (id === null) continue; // unequip
    const cosmetic = byId.get(id);
    if (!cosmetic) throw new AppError(404, "NOT_FOUND", "That cosmetic does not exist");
    if (SLOT_BY_CATEGORY[cosmetic.category] !== slot) {
      throw new AppError(400, "VALIDATION_ERROR", `That cosmetic does not go in the ${slot} slot`);
    }
    if (!pet.inventory.includes(id)) {
      throw new AppError(409, "CONFLICT", "That cosmetic isn't in your inventory yet.");
    }
  }

  const filter = { ownerId: user._id };
  if (ids.length > 0) filter.inventory = { $all: ids }; // still owned at write time
  const $set = Object.fromEntries(changes.map(([slot, id]) => [`equipped.${slot}`, id]));

  const updated = await Pet.findOneAndUpdate(filter, { $set }, { returnDocument: "after" });
  if (!updated) throw new AppError(409, "CONFLICT", "That cosmetic isn't in your inventory yet.");
  return toGameJson(user, updated);
}

// POST /api/minigames/reward: coins for a finished minigame (UN-303 stop-gap; UN-501 will
// grade the quiz on the server). The client still reports `correctCount`, so the server limits
// what a client can claim: at most 5 coins per play, one claim per cooldown (atomic, so parallel
// requests cannot stack) and a maximum number of plays per UTC day. Without these limits
// anyone could call this endpoint in a loop and get unlimited coins.
export async function awardMinigameCoins(user, correctCount) {
  if (!Number.isInteger(correctCount) || correctCount <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "No coins earned this round.");
  }
  const reward = Math.min(correctCount, MINIGAME_MAX_COINS_PER_PLAY);
  const { cooldownMs, maxPlaysPerDay } = minigameLimits();
  const now = clock.now();

  await getPet(user); // 404 if the student has no Pancho yet

  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const playsToday = await MinigamePlay.countDocuments({ studentId: user._id, playedAt: { $gte: dayStart } });
  if (playsToday >= maxPlaysPerDay) {
    throw new AppError(429, "RATE_LIMITED", "Daily minigame limit reached. Come back tomorrow.");
  }

  // The cooldown is claimed and the coins are paid in ONE update.
  const pet = await Pet.findOneAndUpdate(
    {
      ownerId: user._id,
      $or: [{ lastMinigameAt: null }, { lastMinigameAt: { $lte: new Date(now - cooldownMs) } }],
    },
    { $inc: { coins: reward }, $set: { lastMinigameAt: new Date(now) } },
    { returnDocument: "after" }
  );
  if (!pet) throw new AppError(429, "RATE_LIMITED", "Wait a moment before playing again.");

  await MinigamePlay.create({ studentId: user._id, gameId: "quiz", reward, playedAt: new Date(now) });
  return toGameJson(user, pet);
}
