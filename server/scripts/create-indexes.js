// Crea (sin borrar nada) todos los índices definidos en los modelos.
//   npm run db:indexes
// Hay que correrlo UNA vez contra Atlas, porque en Vercel autoIndex está desactivado (ver config/db.js).
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import "../models/index.js";
import RateLimit from "../models/RateLimit.js";

try {
  await connectDB();
  console.log(`Base: ${mongoose.connection.name}`);
  for (const Model of new Set([...Object.values(mongoose.models), RateLimit])) {
    await Model.createCollection().catch(() => {});
    await Model.createIndexes();
    const idx = await Model.collection.indexes();
    console.log(`✅ ${Model.collection.collectionName.padEnd(16)} ${idx.length} índices`);
  }
} catch (error) {
  console.error("❌ No se pudieron crear los índices:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
