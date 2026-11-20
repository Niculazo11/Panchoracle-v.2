// End-to-end check that the app can talk to MongoDB (Atlas or local):
//   npm run db:check
// Connects, pings, WRITES a document, READS it back, DELETES it, and verifies the schema.
// Doesn't touch your data: uses only the temporary "__healthcheck" collection.
import "dotenv/config";
import mongoose from "mongoose";
import { redact } from "../utils/safeLog.js";

const EXPECTED = ["users", "classrooms", "assignments", "pets", "submissions", "minigame_plays", "cosmetics", "quiz_questions", "rate_limits"];
const ok = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const fail = (m) => console.log(`  ❌ ${m}`);

// Translates common Atlas errors into a cause and concrete action.
function hint(message) {
  const m = String(message);
  if (/bad auth|authentication failed/i.test(m)) return "Wrong username or password. Check Atlas → Database Access and, if the password has @ : / ? # %, encode it (encodeURIComponent).";
  if (/not authorized|requires authentication/i.test(m)) return "User exists but lacks write permission. Atlas → Database Access → Edit → 'readWrite' role on the database in the URI.";
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(m)) return "Cannot resolve cluster DNS. Verify the URI host is copied correctly; if it persists, your DNS blocks SRV: use DNS 8.8.8.8 or the 'mongodb://' (not +srv) string from Atlas.";
  if (/Server selection timed out|ReplicaSetNoPrimary|ECONNREFUSED|ETIMEDOUT|SSL|tlsv1/i.test(m)) return "No network route to Atlas. Atlas → Network Access → add your current IP (or 0.0.0.0/0 for Vercel) and confirm the cluster is NOT paused.";
  if (/Invalid scheme|Invalid connection string|URI/i.test(m)) return "MONGODB_URI is malformed. Must start with mongodb+srv:// or mongodb://";
  return "Check the error above and the 'Troubleshooting' section of the guide.";
}

const uri = process.env.MONGODB_URI;
console.log("\n=== MongoDB Diagnostics ===");
if (!uri) {
  fail("MONGODB_URI is not defined. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

// Show host/user/database WITHOUT the password.
try {
  const u = new URL(uri);
  const dbName = u.pathname.replace("/", "");
  console.log(`  host: ${u.host}\n  user: ${decodeURIComponent(u.username) || "(no user)"}\n  database in URI: ${dbName || "(NONE → would use 'test')"}`);
  if (!dbName || dbName === "test") warn("URI doesn't name a database. Add /panchoracle before the '?' (…mongodb.net/panchoracle?retryWrites=true&w=majority).");
} catch {
  warn("Could not parse URI for display (will attempt connection anyway).");
}

let exitCode = 0;
try {
  const t0 = Date.now();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false });
  ok(`Conexión abierta en ${Date.now() - t0} ms (base: ${mongoose.connection.name})`);

  const t1 = Date.now();
  await mongoose.connection.db.admin().ping();
  ok(`Ping correcto (${Date.now() - t1} ms de ida y vuelta)`);

  // ---- escribir / leer / borrar ----
  const col = mongoose.connection.db.collection("__healthcheck");
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { insertedId } = await col.insertOne({ nonce, createdAt: new Date() });
  ok("Escritura correcta (insertOne en __healthcheck)");
  const back = await col.findOne({ _id: insertedId });
  if (back?.nonce === nonce) ok("Lectura correcta: el dato leído coincide con el escrito");
  else { fail("Lo leído NO coincide con lo escrito"); exitCode = 1; }
  await col.deleteOne({ _id: insertedId });
  await col.drop().catch(() => {});
  ok("Borrado correcto (colección temporal eliminada)");

  // ---- esquema del proyecto ----
  const present = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
  const missing = EXPECTED.filter((n) => !present.includes(n));
  if (missing.length === 0) ok(`Las ${EXPECTED.length} colecciones del ADR existen`);
  else warn(`Faltan colecciones: ${missing.join(", ")} → ejecuta "npm run db:indexes" y "npm run seed" (en local).`);

  if (present.includes("users")) {
    const idx = await mongoose.connection.db.collection("users").indexes();
    if (idx.some((i) => i.key.email === 1 && i.unique)) ok("Índice único users.email presente");
    else { warn('Falta el índice único de users.email → ejecuta "npm run db:indexes" (sin él se pueden duplicar correos).'); }
  }
  for (const name of ["users", "classrooms", "pets", "cosmetics", "quiz_questions"]) {
    if (present.includes(name)) console.log(`     · ${name}: ${await mongoose.connection.db.collection(name).countDocuments()} documentos`);
  }
  console.log("\n🎉 MongoDB está operativo para esta aplicación.\n");
} catch (error) {
  fail(redact(error.message));
  console.log(`\n  👉 ${hint(error.message)}\n`);
  exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
process.exit(exitCode);
