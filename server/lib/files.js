// @ts-check
import { envOr } from "./env.js";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

const UPLOADS_DIR = envOr("UPLOADS_DIR", "uploads");

export async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function saveUpload(filename, buffer, mimeType) {
  await ensureUploadsDir();

  // Simple MIME sniffing / validation
  const allowedMimes = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "text/csv": ".csv",
    "application/vnd.ms-excel": ".csv",
    "application/x-binary": ".map", // Generic for binary maps
  };

  const ext = allowedMimes[mimeType] || ".bin";
  const safeName = `${randomBytes(16).toString("hex")}${ext}`;
  const path = join(UPLOADS_DIR, safeName);

  await writeFile(path, buffer);
  return { path, filename: safeName, mimeType };
}

export function getSignedUrl(filename) {
  // In a real production env with S3, this would be a real signed URL.
  // For this local rebuild, we return a proxy URL.
  return `/api/files/download/${filename}`;
}
