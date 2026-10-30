// @ts-check

/**
 * @param {string} method
 * @param {string} url
 * @param {unknown} [body]
 */
export async function api(method, url, body) {
  /** @type {RequestInit} */
  const init = {
    method,
    credentials: "include",
    headers: {
      "x-wwt-csrf": "1",
    },
  };
  if (body !== undefined) {
    init.headers = { .../** @type {Record<string,string>} */ (init.headers), "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data };
}
