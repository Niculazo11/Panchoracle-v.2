import { useAccess } from "./useAccess.js";

export function useRole() {
  const { role } = useAccess();
  return role;
}