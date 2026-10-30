// @ts-check

/**
 * @typedef {{ get: (name: string) => string | undefined, set: (name: string, value: string, opts?: Record<string, unknown>) => void, delete: (name: string) => void }} CookieJar
 */

/**
 * @param {number} status
 * @param {string} title
 * @param {string} [detail]
 * @param {string} [requestId]
 */
export function problem(status, title, detail = "", requestId = "") {
  const body = {
    type: "about:blank",
    title,
    status,
    detail,
    requestId,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/problem+json; charset=utf-8",
      "x-request-id": requestId,
      "cache-control": "no-store",
    },
  });
}

/**
 * @param {unknown} data
 * @param {number} [status]
 * @param {Record<string, string>} [extraHeaders]
 */
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

/** @param {Request} req */
export function wantsMutatingHeader(req) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return true;
  return req.headers.get("x-wwt-csrf") === "1";
}

/**
 * @param {Request} req
 * @param {any} context
 */
export function requestId(req, context) {
  return context?.requestId || req.headers.get("x-request-id") || crypto.randomUUID();
}

/**
 * @param {Request} req
 * @param {any} context
 * @returns {CookieJar}
 */
export function cookieJar(req, context) {
  if (context?.cookies?.get && context?.cookies?.set) return context.cookies;
  const header = req.headers.get("cookie") || "";
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    map.set(part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim()));
  }
  /** @type {string[]} */
  const pending = [];
  return {
    pending,
    get(name) {
      return map.get(name);
    },
    set(name, value, opts = {}) {
      map.set(name, value);
      const parts = [`${name}=${encodeURIComponent(value)}`];
      if (opts.httpOnly) parts.push("HttpOnly");
      if (opts.secure) parts.push("Secure");
      if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
      if (opts.path) parts.push(`Path=${opts.path}`);
      if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
      pending.push(parts.join("; "));
    },
    delete(name) {
      map.delete(name);
      pending.push(`${name}=; Path=/; Max-Age=0`);
    },
  };
}

/**
 * Attach Set-Cookie from a jar that recorded pending cookies via a WeakMap.
 * Dev server reads `x-set-cookie` and splits.
 * @param {Response} res
 * @param {string[]} cookies
 */
export function withCookies(res, cookies) {
  if (!cookies.length) return res;
  const headers = new Headers(res.headers);
  headers.set("x-set-cookie", cookies.join("\n"));
  return new Response(res.body, { status: res.status, headers });
}
