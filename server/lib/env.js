// @ts-check

/**
 * @param {string} name
 * @returns {string | undefined}
 */
export function env(name) {
  try {
    // @ts-ignore Netlify global in functions
    if (typeof Netlify !== "undefined" && Netlify.env) {
      const v = Netlify.env.get(name);
      if (v != null && v !== "") return v;
    }
  } catch {
    /* local node */
  }
  const v = process.env[name];
  return v == null || v === "" ? undefined : v;
}

/**
 * @param {string} name
 * @param {string} [fallback]
 */
export function envOr(name, fallback = "") {
  return env(name) ?? fallback;
}
