import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(readFileSync(join(root, "design/tokens.json"), "utf8"));

const lines = ["/* Generated from design/tokens.json — run `npm run tokens` after editing tokens. */", ":root {"];
for (const [group, values] of Object.entries(tokens)) {
  for (const [name, value] of Object.entries(values)) {
    const prop = `--${group === "color" ? name : `${group}-${name}`}`;
    lines.push(`  ${prop}: ${value};`);
  }
}
lines.push("}");

writeFileSync(join(root, "web/css/01-tokens.css"), lines.join("\n"));
console.log("wrote web/css/01-tokens.css");
