// Business logic for the student's game state (UN-301): adopt, buy and equip.
// Ports the rules of src/state/actions/pancho.js and shop.js, with the server as the source
// of truth. Every write is a single atomic update guarded by its own preconditions, so a
// failed request never changes anything (ADR 6.10).
import AppError from "../utils/AppError.js";
import { Assignment, Classroom, Cosmetic, Pet, Submission } from "../models/index.js";
import { DEFAULT_ASSIGNMENT, SLOTS, SLOT_BY_CATEGORY, STEP_LABELS } from "../config/game.js";

function buildSteps() {
  return STEP_LABELS.map((label, index) => ({ id: index + 1, label, completed: false }));
}

// Only a student that joined a classroom has a Pancho (created on join, ADR 8.4).
async function getPet(user) {
  const pet = await Pet.findOne({ ownerId: user._id });
  if (!pet) throw new AppError(404, "NOT_FOUND", "You do not have a Pancho yet: join a classroom first");
  return pet;
}

// ADR 5.3: the active assignment is the first one (by dueAt) the student has not submitted,
// with dueAt in the future and the period already started. Falls back to the default task.
async function getCurrentAssignment(user) {
  let active = null;
  const classroom = user.classroomId ? await Classroom.findById(user.classroomId) : null;
  if (classroom && Date.now() >= classroom.period.startDate.getTime()) {
    const assignments = await Assignment.find({
      classroomId: classroom._id,
      periodId: classroom.period.periodId,
      dueAt: { $gt: new Date() },
    }).sort({ dueAt: 1 });
    const submitted = await Submission.find({
      studentId: user._id,
      assignmentId: { $in: assignments.map((item) => item._id) },
    }).select("assignmentId");
    const done = new Set(submitted.map((item) => item.assignmentId.toString()));
    active = assignments.find((item) => !done.has(item._id.toString())) || null;
  }
  if (!active) return { ...DEFAULT_ASSIGNMENT, steps: buildSteps() };
  return {
    id: active._id.toString(),
    title: active.title,
    description: active.description,
    dueAt: active.dueAt,
    steps: buildSteps(),
  };
}

// Same shape the client keeps in useGameState() (src/state/defaults.js), so UN-303 can swap
// localStorage for this response. The client writes status as "ALIVE" / "DEAD".
async function toGameJson(user, pet) {
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
    currentAssignment: await getCurrentAssignment(user),
  };
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
