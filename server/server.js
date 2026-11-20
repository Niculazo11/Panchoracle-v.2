// Local development entry point ONLY. Not used in Vercel (see api/index.js).
// import "dotenv/config" loads your .env (only here; in Vercel the dashboard sets variables).
// Starts the server and attempts MongoDB connection to log status; if it fails, the server
//  stays alive and explains why this is local-only.
import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { redact } from "./utils/safeLog.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  connectDB()
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.error("Failed to connect to MongoDB:", redact(error.message)));
});