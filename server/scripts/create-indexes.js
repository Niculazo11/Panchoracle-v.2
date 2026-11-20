// Creates (without deleting anything) all indexes defined in the models.
//   npm run db:indexes
// Must run ONCE against Atlas, because autoIndex is disabled in Vercel (see config/db.js).
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import "../models/index.js";
import RateLimit from "../models/RateLimit.js";

try {
  await connectDB();
  console.log(`Database: ${mongoose.connection.name}`);
  for (const Model of new Set([...Object.values(mongoose.models), RateLimit])) {
    await Model.createCollection().catch(() => {});
    await Model.createIndexes();
    const idx = await Model.collection.indexes();
    console.log(`✅ ${Model.collection.collectionName.padEnd(16)} ${idx.length} indexes`);
  }
} catch (error) {
  console.error("❌ Could not create indexes:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
