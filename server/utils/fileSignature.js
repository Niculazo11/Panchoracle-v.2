// Checks that the first bytes of a file really are what its type says, so a script cannot be
// stored as "image/png". Only the four types students may hand in are known.
const SIGNATURES = {
  "image/jpeg": (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  "application/pdf": (b) => b.length > 5 && b.toString("ascii", 0, 5) === "%PDF-",
};

export function matchesSignature(mimeType, buffer) {
  const check = SIGNATURES[mimeType];
  return Boolean(check) && check(buffer);
}
