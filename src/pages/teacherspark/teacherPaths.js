// Every route of the teacher area (UN-401). Sub-routes live under /teachersPark.
// PARK_PATH is the panel (list of classrooms); the park view of one classroom is CLASSROOM_PATH.
export const PARK_PATH = "/teachersPark";
export const CLASSROOM_PATH = "/teachersPark/classroom";
export const NEW_CLASSROOM_PATH = "/teachersPark/newClassroom";
export const SETTINGS_PATH = "/teachersPark/settings";
// Top-bar tabs. Placeholder pages until their own tickets exist.
export const HOMEWORK_PATH = "/teachersPark/homework";
export const SEARCH_PATH = "/teachersPark/search";
export const MINIGAMES_PATH = "/teachersPark/minigames";
// Student list of the classroom (UN-403) and the detail page of one student (UN-404).
export const STUDENTS_PATH = "/teachersPark/students";
export function studentPath(studentId) {
    return STUDENTS_PATH + "/" + studentId;
}
// Rows of Manage Homework open the submitted homework of one assignment (UN-405).
export const ADD_HOMEWORK_PATH = "/teachersPark/homework/new";
export function editHomeworkPath(assignmentId) {
    return HOMEWORK_PATH + "/" + assignmentId + "/edit";
}
export function submissionsPath(assignmentId) {
    return HOMEWORK_PATH + "/" + assignmentId + "/submissions";
}
