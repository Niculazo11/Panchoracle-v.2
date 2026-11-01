// Arranque SOLO para desarrollo local. En Vercel no se usa (ver api/index.js).
//import "dotenv/config" carga tu .env (solo aquí; en Vercel las variables las pone el dashboard). 
// Enciende el servidor e intenta conectar a Mongo para avisarte en la terminal; si falla, el servidor
//  sigue vivo y te dice por qué se usa solo en local.
import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { redact } from "./utils/safeLog.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  connectDB()
    .then(() => console.log("MongoDB conectado"))
    .catch((error) => console.error("No se pudo conectar a MongoDB:", redact(error.message)));
});