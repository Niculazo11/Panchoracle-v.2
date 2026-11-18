// SRV_STU_PET_META · extra Pancho data for the teacher's student list.
// Pure functions: no database, no Express. Every field falls back to null, so a student
// without a chosen dog or without cosmetics never breaks the response.
import { SLOTS } from "../config/game.js";

// dog.ceo image URLs look like https://images.dog.ceo/breeds/<breed>/<file>.jpg
// (a sub-breed is written "hound-afghan"). Anything else has no breed.
const BREED_FROM_URL = /^https:\/\/images\.dog\.ceo\/breeds\/([a-z0-9-]+)\//;

export function breedFromImgUrl(imgUrl) {
  if (typeof imgUrl !== "string") return null;
  const match = BREED_FROM_URL.exec(imgUrl);
  return match ? match[1] : null;
}

// pet.panchoId / pet.imgUrl are the dog the student picked in /choose (option 1 or 2);
// pet.equipped holds the cosmetic id of each slot (same shape as `equippedCosmetics`
// in the game state).
export function toPetMetadata(pet) {
  const equipped = pet.equipped ?? {};
  const cosmetics = {};
  for (let i = 0; i < SLOTS.length; i++) {
    cosmetics[SLOTS[i]] = equipped[SLOTS[i]] ?? null;
  }
  return {
    dogId: pet.panchoId ?? null,
    breed: breedFromImgUrl(pet.imgUrl),
    imgUrl: pet.imgUrl ?? null,
    cosmetics,
  };
}
