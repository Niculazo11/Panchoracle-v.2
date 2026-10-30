import mongoose from "mongoose";

// "global" sobrevive entre invocaciones de una función serverless mientras
// vercel la mantenga "caliente" osea guardamos ahí la conexión para reutilizarla.
const cache = (global.__mongooseCache ??= { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn; // ya conectado: reutilizar

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Falta la variable de entorno MONGODB_URI");
    }
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null; // si falló entocnes permitir reintentar en la próxima petición
    throw error;
  }
  return cache.conn;
}

// Middleware para las rutas que SÍ necesitan base de datos.
// Uso: app.use("/api/algo", ensureDb, algoRouter)
export async function ensureDb(req, res, next) {
  await connectDB();
  next();
}