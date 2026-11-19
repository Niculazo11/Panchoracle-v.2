// The join form asks "Are you a student or a teacher?" in a free-text box.
// Returns the role to register with: "teacher" only when the answer says teacher
// (and does not also say student, e.g. "student, not a teacher" stays a student).
export function roleFromAnswer(answer) {
    const text = (answer || "").toLowerCase();
    const saysTeacher = /\bteacher\b/.test(text);
    const saysStudent = /\bstudent\b/.test(text);
    return saysTeacher && !saysStudent ? "teacher" : "student";
}
