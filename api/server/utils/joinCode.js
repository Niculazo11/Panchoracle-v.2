// Join code helpers (ADR 5.6 / D7).
// Format decision (ADR section 12 left it open): 6 characters, uppercase letters and
// digits, without look-alike characters (no 0, O, 1, I, L) so it is easy to read aloud.
import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 6;

export function generateJoinCode() {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

// Codes are always stored and compared in uppercase (ADR 8.2).
export function normalizeJoinCode(value) {
  return String(value).trim().toUpperCase();
}
