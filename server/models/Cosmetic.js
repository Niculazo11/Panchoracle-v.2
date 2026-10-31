import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.7 / UN-102. Los campos salen 1:1 de src/data/dataset.json
// (id, name, category, cost, image). Este archivo SOLO define el modelo:
// el seed y la migración del frontend corresponden a UN-111.
const cosmeticSchema = new Schema(
  {
    // Se conserva el "id" numérico del dataset porque el frontend lo
    // usa en student.inventory y en la URL /Shop/:cosmeticId. Se llama
    // "cosmeticId" para no chocar con el virtual "id" de Mongoose.
    cosmeticId: {
      type: Number,
      required: [true, "cosmeticId es obligatorio"],
      unique: true, // clave natural: compras e inventario buscan por este id
      min: 1,
      validate: { validator: Number.isInteger, message: "cosmeticId debe ser entero" },
    },
    name: { type: String, required: [true, "name es obligatorio"], trim: true, maxlength: 80 }, // longitud: decisión técnica
    // Valores reales del dataset (mismas mayúsculas que CATEGORY_TO_SLOT del frontend).
    category: {
      type: String,
      required: [true, "category es obligatorio"],
      enum: { values: ["Head", "Face", "Neck", "Body"], message: "category debe ser Head, Face, Neck o Body" },
    },
    cost: {
      type: Number,
      required: [true, "cost es obligatorio"],
      min: 0,
      validate: { validator: Number.isInteger, message: "cost debe ser entero" },
    },
    // Ruta relativa tal como está en el dataset (p. ej. "images/skully-bow.png").
    image: { type: String, required: [true, "image es obligatorio"], trim: true, maxlength: 200 }, // longitud: decisión técnica
  },
  { collection: "cosmetics" }
);

export default mongoose.models.Cosmetic || mongoose.model("Cosmetic", cosmeticSchema);