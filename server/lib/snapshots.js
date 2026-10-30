// @ts-check
import { readFile, writeFile, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { envOr } from "./env.js";

const BACKUP_DIR = envOr("BACKUP_DIR", "backups");
const MAX_SNAPSHOTS = 7;

export async function rotateSnapshots() {
  try {
    const files = await readdir(BACKUP_DIR);
    const backups = files
      .filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
      .sort();

    if (backups.length > MAX_SNAPSHOTS) {
      const toDelete = backups.slice(0, backups.length - MAX_SNAPSHOTS);
      for (const f of toDelete) {
        await unlink(join(BACKUP_DIR, f));
      }
      return { deleted: toDelete.length };
    }
    return { deleted: 0 };
  } catch (err) {
    // Likely dir doesn't exist yet
    return { deleted: 0, error: err.message };
  }
}
