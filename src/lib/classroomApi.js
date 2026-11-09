// Calls to the classrooms API (UN-106). All network access goes through api.js.
// Dates must be ISO 8601 UTC strings, for example "2027-02-01T00:00:00Z".
import { api } from "./api.js";

// Returns the teacher's classroom, or null when they have none yet.
export async function getMyClassroom(signal) {
  const data = await api.get("/classrooms", { signal });
  if (data.classrooms.length === 0) {
    return null;
  }
  return data.classrooms[0];
}

export async function createClassroom(name, startDate, endDate) {
  const data = await api.post("/classrooms", {
    name,
    period: { startDate, endDate },
  });
  return data.classroom;
}

export async function renameClassroom(id, name) {
  const data = await api.patch("/classrooms/" + id, { name });
  return data.classroom;
}

// Unenrolls the students and keeps their pets. Resolves with { unenrolledStudents }.
export function deleteClassroom(id) {
  return api.delete("/classrooms/" + id);
}

export async function getStudents(id, signal) {
  const data = await api.get("/classrooms/" + id + "/students", { signal });
  return data.students;
}