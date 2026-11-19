// Calls to the assignments API (UN-107). All network access goes through api.js.
import { api } from "./api.js";

// Returns the classroom's assignments ordered by due date (soonest first).
export async function getAssignments(signal) {
  const data = await api.get("/assignments", { signal });
  const list = Array.isArray(data) ? data : data.assignments || [];
  return [...list].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
}
