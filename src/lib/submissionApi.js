// Calls to the submissions API. All network access goes through api.js.
// Contract: docs/submissions-api.md (proposal, the server side is still to be written).
import { api } from "./api.js";

// The logged-in student's submissions: [{ id, assignmentId, kind, fileName, fileUrl, submittedAt }].
export async function getMySubmissions(signal) {
  const data = await api.get("/me/submissions", { signal });
  return Array.isArray(data) ? data : data.submissions || [];
}

// payload is { kind: "link", url } or { kind: "file", fileName, mimeType, dataBase64 }.
export async function submitHomework(assignmentId, payload) {
  const data = await api.post("/assignments/" + assignmentId + "/submissions", payload);
  return data.submission || data;
}

// Teacher: everything handed in for one assignment, with the student who sent it:
// [{ id, assignmentId, student: { id, name }, kind, fileName, fileUrl, submittedAt }].
export async function getAssignmentSubmissions(assignmentId, signal) {
  const data = await api.get("/assignments/" + assignmentId + "/submissions", { signal });
  return Array.isArray(data) ? data : data.submissions || [];
}
