import { useAccess } from "./useAccess.js";

export function useRole() {
  return useAccess().role;
}