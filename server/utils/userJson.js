export function toUserJson(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    classroomId: user.classroomId ? user.classroomId.toString() : null,
    createdAt: user.createdAt,
  };
}