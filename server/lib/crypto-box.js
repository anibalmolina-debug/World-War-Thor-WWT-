// @ts-check
import { scrypt, randomBytes, createCipheriv, createDecipheriv, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { envOr } from "./env.js";

const scryptAsync = promisify(scrypt);

const SCRYPT_N = 4096;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 32;

function keyMaterial(name) {
  const raw = envOr(name, envOr("SESSION_SECRET", "dev-only-not-for-production-use!!!!!"));
  return createHash("sha256").update(raw).digest();
}

/**
 * @param {string} secret
 */
export async function hashSecret(secret) {
  const salt = randomBytes(16);
  const hash = /** @type {Buffer} */ (await scryptAsync(secret, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }));
  return `s2:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * @param {string} secret
 * @param {string} stored
 */
export async function verifySecret(secret, stored) {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "s2") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const hash = /** @type {Buffer} */ (await scryptAsync(secret, salt, expected.length, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }));
  if (hash.length !== expected.length) return false;
  return timingSafeEqual(hash, expected);
}

/**
 * Encrypted copy so the GM can print classroom codewords. See docs/adr/0001-codeword-storage.md
 * @param {string} plaintext
 */
export function encryptCodeword(plaintext) {
  const key = keyMaterial("CODEWORD_KEY");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/**
 * @param {string} packed
 */
export function decryptCodeword(packed) {
  const parts = packed.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("bad envelope");
  const key = keyMaterial("CODEWORD_KEY");
  const iv = Buffer.from(parts[1], "hex");
  const tag = Buffer.from(parts[2], "hex");
  const enc = Buffer.from(parts[3], "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function randomToken() {
  return randomBytes(32).toString("hex");
}

/** @param {string} token */
export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * @param {string} input
 */
export function normalizeCodeword(input) {
  const folded = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const word = folded.split(/\s+/)[0] || "";
  return word.replace(/[^a-z0-9]/g, "");
}
