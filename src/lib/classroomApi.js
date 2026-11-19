// Calls to the classrooms API (UN-106). All network access goes through api.js.
// Dates must be ISO 8601 UTC strings, for example "2027-02-01T00:00:00Z".
import { api } from "./api.js";

// Returns the teacher's classroom, or null when they have none yet.
export async function getMyClassroom(signal) {
  try {
    const data = await api.get("/classrooms/me", { signal });
    return data.classroom;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function createClassroom(name, startDate, endDate) {
  const data = await api.post("/classrooms", {
    name,
    period: { startDate, endDate },
  });
  return data.classroom;
}

// Student joins a classroom with a join code. Creates their Pancho on first join.
export async function joinClassroom(joinCode) {
  const data = await api.post("/classrooms/join", { joinCode });
  return data; // { classroom, alreadyJoined }
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
// Unenrolls one student. Their Pancho, coins and cosmetics are kept (see classrooms-api.md).
export function removeStudent(classroomId, studentId) {
  return api.delete("/classrooms/" + classroomId + "/students/" + studentId);
}

// Minigame assignments (UN-XXX) - Teacher only
export async function assignMinigame(classroomId, minigameId) {
  const data = await api.post("/classrooms/" + classroomId + "/minigames/assign", { minigameId });
  return data.assignment;
}

export async function getAssignedMinigames(classroomId, signal) {
  const data = await api.get("/classrooms/" + classroomId + "/minigames", { signal });
  return data.assignments;
}

export async function removeMinigameAssignment(classroomId, assignmentId) {
  return api.delete("/classrooms/" + classroomId + "/minigames/" + assignmentId);
}

// Minigame plays/completions for teacher view
export async function getClassroomMinigamePlays(classroomId, signal) {
  const data = await api.get("/classrooms/" + classroomId + "/minigames/plays", { signal });
  return data.plays;
}
