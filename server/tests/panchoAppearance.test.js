// UN-401 · Look of a student's Pancho in the students list (pure function, no database).
// Run with: node --test server/tests/panchoAppearance.test.js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toPanchoAppearance } from "../utils/panchoAppearance.js";

describe("toPanchoAppearance", () => {
  it("returns null when the student has no pet", () => {
    assert.equal(toPanchoAppearance(null), null);
    assert.equal(toPanchoAppearance(undefined), null);
  });

  it("returns the name, the chosen dog and the equipped cosmetics", () => {
    const pet = {
      name: "Rocky",
      panchoId: "hound_1",
      imgUrl: "https://images.dog.ceo/breeds/hound/1.jpg",
      equipped: { head: 3, face: null, neck: 7, body: null },
    };
    assert.deepEqual(toPanchoAppearance(pet), {
      name: "Rocky",
      panchoId: "hound_1",
      imgUrl: "https://images.dog.ceo/breeds/hound/1.jpg",
      equipped: { head: 3, face: null, neck: 7, body: null },
    });
  });

  it("uses null for a dog that was not chosen yet and fills every slot", () => {
    const result = toPanchoAppearance({ name: "Pancho", panchoId: null, imgUrl: null });
    assert.equal(result.panchoId, null);
    assert.equal(result.imgUrl, null);
    assert.deepEqual(result.equipped, { head: null, face: null, neck: null, body: null });
  });

  it("ignores values that are not cosmetic ids and keeps only the four slots", () => {
    const result = toPanchoAppearance({ name: "A", equipped: { head: "3", face: undefined, neck: 5, body: null, tail: 9 } });
    assert.deepEqual(result.equipped, { head: null, face: null, neck: 5, body: null });
  });

  it("falls back to the name Pancho and does not change the pet", () => {
    const pet = { equipped: { head: 1 } };
    const result = toPanchoAppearance(pet);
    assert.equal(result.name, "Pancho");
    assert.deepEqual(pet, { equipped: { head: 1 } });
  });
});
