import test from "node:test";
import assert from "node:assert/strict";
import { matchesSignature } from "../utils/fileSignature.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBPVP8 ")]);
const PDF = Buffer.from("%PDF-1.7\n%...");

test("accepts the real signature of each allowed type", () => {
  assert.equal(matchesSignature("image/png", PNG), true);
  assert.equal(matchesSignature("image/jpeg", JPEG), true);
  assert.equal(matchesSignature("image/webp", WEBP), true);
  assert.equal(matchesSignature("application/pdf", PDF), true);
});

test("rejects a file whose bytes do not match the declared type", () => {
  assert.equal(matchesSignature("image/png", JPEG), false);
  assert.equal(matchesSignature("application/pdf", Buffer.from("<script>alert(1)</script>")), false);
  assert.equal(matchesSignature("image/jpeg", Buffer.alloc(0)), false);
});

test("rejects types that are not allowed", () => {
  assert.equal(matchesSignature("image/svg+xml", Buffer.from("<svg></svg>")), false);
  assert.equal(matchesSignature("text/html", Buffer.from("<html>")), false);
});
