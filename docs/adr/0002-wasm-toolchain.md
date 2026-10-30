# ADR 0002 — WASM toolchain gap (S1)

The plan compiles `wwt_core` and `wwt_ui` with Emscripten. This machine did not
have `emcc`, CMake, or Python when S1 started.

S1 therefore:

- Keeps C++ sources and CMake for core (cipher, version) and a UI stub.
- Runs a JS twin of `Cipher::caesar` and a JS UI that emits the same semantic
  DOM the CSS styles. Glue stays rule-free.
- `npm run build:wasm` no-ops with a warning until `emcc` is on PATH.

Next: install emsdk, compile `wwt_ui.wasm`, and replace `web/glue/app.js` as
the view source of truth.
