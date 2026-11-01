// Auth helpers for the new cookie-based authentication system.
// The actual auth state (status, user, role) lives in useAccess.js.
// This file is kept for backwards compatibility only — new code should use useAccess().

// No localStorage flag anymore; token lives in httpOnly cookie managed by backend.
// useAccess() handles login/logout via API calls to /api/auth/*.

export function getAuthToken() {
  // httpOnly cookie cannot be read from JS; this returns null.
  // Kept for API compatibility if needed.
  return null;
}

export function clearAuthToken() {
  // httpOnly cookie cleared by backend on POST /api/auth/logout.
  // Kept for API compatibility if needed.
}