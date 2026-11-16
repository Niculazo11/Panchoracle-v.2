// Validation for the game endpoints (UN-301). strictObject rejects unknown keys, and
// z.number()/z.string() reject objects, arrays and numeric strings (no NoSQL operators).
import { z } from "zod";

const cosmeticId = z.number({ error: "cosmeticId must be a number" }).int("cosmeticId must be an integer").positive("cosmeticId must be positive");

// POST /api/pets/me/inventory
export const buyCosmeticSchema = z.strictObject({ cosmeticId });

// PUT /api/pets/me/equipped: the slots to change. null unequips; omitted slots do not change.
const slotValue = cosmeticId.nullable().optional();
export const equipSchema = z
  .strictObject({ head: slotValue, face: slotValue, neck: slotValue, body: slotValue })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "send at least one slot: head, face, neck or body",
  });

// PUT /api/pets/me/pancho. The image must come from dog.ceo (the only source the client uses),
// so the API cannot be used to store arbitrary URLs.
export const choosePanchoSchema = z.strictObject({
  panchoId: z
    .string({ error: "panchoId must be a string" })
    .trim()
    .min(1, "panchoId is required")
    .max(100, "panchoId must have at most 100 characters")
    .regex(/^[A-Za-z0-9._-]+$/, "panchoId has invalid characters"),
  imgUrl: z
    .string({ error: "imgUrl must be a string" })
    .trim()
    .max(500, "imgUrl must have at most 500 characters")
    .regex(/^https:\/\/images\.dog\.ceo\/[A-Za-z0-9/_.-]+$/, "imgUrl must be an https://images.dog.ceo/ image"),
});
