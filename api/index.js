// Punto de entrada para Vercel (serverless). Solo reexporta la app de Express.
//Vercel convierte cada archivo dentro de /api en una función serverless, y espera 
// que exporten un manejador (req, res). Una app de Express es ese manejador. Entonces 
// api/index.js es un “puente”: importa tu app de server/app.js y la entrega a Vercel. 
// No tiene lógica propia, así que no pongas nada más aquí. Probé que el import funciona y
// exporta una función.
import app from "../server/app.js";

export default app;