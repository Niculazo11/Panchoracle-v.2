// Determines user role from the "student or teacher?" answer field.
// Anything containing "teacher" (case-insensitive) becomes a teacher; otherwise student.

export function roleFromAnswer(answer) {
  return /teacher/i.test(answer) ? "teacher" : "student";
}