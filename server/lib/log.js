// @ts-check

/**
 * @param {string} requestId
 * @param {string} msg
 * @param {Record<string, unknown>} [extra]
 */
export function log(requestId, msg, extra = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), requestId, msg, ...extra }));
}
