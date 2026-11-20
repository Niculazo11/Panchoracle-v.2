import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.7 / UN-102. Fields come 1:1 from src/data/dataset.json
// (id, name, category, cost, image). This file ONLY defines the model:
// seed and frontend migration correspond to UN-111.
const cosmeticSchema = new Schema(
  {
    // Preserves numeric "id" from dataset because frontend uses it
    // in student.inventory and in URL /Shop/:cosmeticId. Called
    // "cosmeticId" to avoid clash with Mongoose virtual "id".
    cosmeticId: {
      type: Number,
      required: [true, "cosmeticId is required"],
      unique: true, // natural key: purchases and inventory look up by this id
      min: 1,
      validate: { validator: Number.isInteger, message: "cosmeticId must be an integer" },
    },
    name: { type: String, required: [true, "name is required"], trim: true, maxlength: 80 }, // length: technical decision
    // Actual values from dataset (same capitalization as CATEGORY_TO_SLOT on frontend).
    category: {
      type: String,
      required: [true, "category is required"],
      enum: { values: ["Head", "Face", "Neck", "Body"], message: "category must be Head, Face, Neck, or Body" },
    },
    cost: {
      type: Number,
      required: [true, "cost is required"],
      min: 0,
      validate: { validator: Number.isInteger, message: "cost must be an integer" },
    },
    // Relative path as in dataset (e.g., "images/skully-bow.png").
    image: { type: String, required: [true, "image is required"], trim: true, maxlength: 200 }, // length: technical decision
  },
  { collection: "cosmetics" }
);

export default mongoose.models.Cosmetic || mongoose.model("Cosmetic", cosmeticSchema);