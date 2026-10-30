import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { envOr } from "./env.js";
import { rotateSnapshots } from "./snapshots.js";

const BACKUP_DIR = envOr("BACKUP_DIR", "backups");

export async function createBackup(s) {
  await mkdir(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.json`;
  const path = join(BACKUP_DIR, filename);

  const data = JSON.stringify(s, null, 2);
  await writeFile(path, data);

  // Automatic rotation
  await rotateSnapshots();

  return { filename, path };
}

export async function restoreBackup(data) {
  const s = globalThis.__WWT_STORE;
  if (!s) throw new Error("Store not initialized");

  const parsed = JSON.parse(data);

  // Basic validation
  if (!parsed.game || !parsed.nations) {
    throw new Error("Invalid backup format: missing core state");
  }

  // Apply state
  Object.assign(s, parsed);
  s.ready = true;

  return { ok: true };
}

