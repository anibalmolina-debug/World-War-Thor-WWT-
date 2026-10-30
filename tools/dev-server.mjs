import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "../server/functions/api.js";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
loadEnv(join(root, ".env"));

const web = join(root, "web");
const port = Number(process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith("/api/")) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks);
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
      }
      const method = req.method || "GET";
      /** @type {RequestInit} */
      const init = { method, headers };
      if (body.length && method !== "GET" && method !== "HEAD") init.body = body;
      const request = new Request(url, init);
      const response = await handler(request, {
        ip: req.socket.remoteAddress,
        requestId: crypto.randomUUID(),
      });
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        if (key === "set-cookie") res.appendHeader("set-cookie", value);
        else res.setHeader(key, value);
      });
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }

    let filePath = join(web, normalize(url.pathname).replace(/^[/\\]+/, ""));
    if (url.pathname === "/" || !(await isFile(filePath))) {
      if (!extname(url.pathname)) filePath = join(web, "index.html");
    }
    if (!filePath.startsWith(web) || !(await isFile(filePath))) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    const buf = await readFile(filePath);
    res.setHeader("content-type", MIME[extname(filePath)] || "application/octet-stream");
    res.end(buf);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("error");
  }
});

server.listen(port, () => {
  console.log(`WWT bunker on http://127.0.0.1:${port}`);
});

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (process.env[k] == null) process.env[k] = v;
  }
}
