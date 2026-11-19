// How a student's Pancho looks (UN-401): name, chosen dog picture and equipped cosmetics.
// Used by the students list so the teacher's park can draw each dog. Pure function, no database.
const SLOTS = ["head", "face", "neck", "body"];

// pet is a Pet document (or a plain object). Returns null when the student has no pet yet.
export function toPanchoAppearance(pet) {
  if (!pet) return null;

  const stored = pet.equipped || {};
  const equipped = {};
  for (let i = 0; i < SLOTS.length; i++) {
    const cosmeticId = stored[SLOTS[i]];
    equipped[SLOTS[i]] = typeof cosmeticId === "number" ? cosmeticId : null;
  }

  return {
    name: pet.name || "Pancho",
    panchoId: pet.panchoId || null,
    imgUrl: pet.imgUrl || null,
    equipped,
  };
}
