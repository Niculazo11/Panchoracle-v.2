// Verifica de punta a punta que la app puede hablar con MongoDB (Atlas o local):
//   npm run db:check
// Conecta, hace ping, ESCRIBE un documento, lo LEE de vuelta, lo BORRA y revisa el esquema.
// No toca tus datos: usa solo la colección temporal "__healthcheck".
import "dotenv/config";
import mongoose from "mongoose";
import { redact } from "../utils/safeLog.js";

const EXPECTED = ["users", "classrooms", "assignments", "pets", "submissions", "minigame_plays", "cosmetics", "quiz_questions", "rate_limits"];
const ok = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const fail = (m) => console.log(`  ❌ ${m}`);

// Traduce los errores más comunes de Atlas a una causa y una acción concreta.
function hint(message) {
  const m = String(message);
  if (/bad auth|authentication failed/i.test(m)) return "Usuario o contraseña incorrectos. Revisa Atlas → Database Access y, si la contraseña tiene @ : / ? # %, codifícala (encodeURIComponent).";
  if (/not authorized|requires authentication/i.test(m)) return "El usuario existe pero no tiene permiso de escritura. Atlas → Database Access → Edit → rol 'readWrite' sobre la base de datos de la URI.";
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(m)) return "No se resuelve el DNS del cluster. Revisa que el host de la URI esté bien copiado; si persiste, tu DNS bloquea SRV: usa DNS 8.8.8.8 o la cadena 'mongodb://' (no +srv) de Atlas.";
  if (/Server selection timed out|ReplicaSetNoPrimary|ECONNREFUSED|ETIMEDOUT|SSL|tlsv1/i.test(m)) return "No hay ruta de red hacia Atlas. Atlas → Network Access → agrega tu IP actual (o 0.0.0.0/0 para Vercel) y confirma que el cluster NO esté pausado.";
  if (/Invalid scheme|Invalid connection string|URI/i.test(m)) return "La cadena MONGODB_URI está mal formada. Debe empezar por mongodb+srv:// o mongodb://";
  return "Revisa el mensaje anterior y la sección 'Troubleshooting' de la guía.";
}

const uri = process.env.MONGODB_URI;
console.log("\n=== Diagnóstico de MongoDB ===");
if (!uri) {
  fail("MONGODB_URI no está definida. Copia .env.example a .env y complétala.");
  process.exit(1);
}

// Muestra host/usuario/base SIN la contraseña.
try {
  const u = new URL(uri);
  const dbName = u.pathname.replace("/", "");
  console.log(`  host: ${u.host}\n  usuario: ${decodeURIComponent(u.username) || "(sin usuario)"}\n  base de datos en la URI: ${dbName || "(NINGUNA → usaría 'test')"}`);
  if (!dbName || dbName === "test") warn("La URI no nombra una base. Añade /panchoracle antes del '?' (…mongodb.net/panchoracle?retryWrites=true&w=majority).");
} catch {
  warn("No pude analizar la URI para mostrarla (se intentará conectar igualmente).");
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
