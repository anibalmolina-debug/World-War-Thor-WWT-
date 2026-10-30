// @ts-check
/** JS twin of core/src/cipher.cpp — used until wwt_core.wasm is built. */
import { CORE_VERSION as RULES_VERSION } from "../../shared/js/rules.js";

/**
 * @param {string} text
 * @param {number} shift
 */
export function caesar(text, shift) {
  let s = shift % 26;
  if (s < 0) s += 26;
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 65 && code <= 90) out += String.fromCharCode(65 + ((code - 65 + s) % 26));
    else if (code >= 97 && code <= 122) out += String.fromCharCode(97 + ((code - 97 + s) % 26));
    else out += ch;
  }
  return out;
}

export const CORE_VERSION = RULES_VERSION;
