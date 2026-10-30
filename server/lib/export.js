// @ts-check
import { json } from "./http.js";
import { envOr } from "./env.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export function exportToCSV(data, headers) {
  const rows = data.map(obj =>
    headers.map(h => {
      const val = obj[h];
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return String(val ?? "").replace(/"/g, '""');
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\\n");
}

export async function saveCSV(filename, content) {
  const dir = envOr("EXPORT_DIR", "exports");
  await import("node:fs/promises").then(fs => fs.mkdir(dir, { recursive: true }));
  const path = join(dir, filename);
  await writeFile(path, content);
  return path;
}
