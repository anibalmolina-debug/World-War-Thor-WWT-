import { spawnSync } from "node:child_process";

const emcc = spawnSync("emcc", ["--version"], { encoding: "utf8" });
if (emcc.status !== 0) {
  console.warn("emcc not found. Skipping WASM build (see docs/adr/0002-wasm-toolchain.md).");
  process.exit(0);
}
console.log("emcc present — wire CMake wasm-ui-web preset here in F0.");
