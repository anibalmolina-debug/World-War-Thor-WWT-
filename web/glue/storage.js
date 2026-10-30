// @ts-check

const PREFIX = "wwt.pref.";

/** @param {string} key */
export function getPref(key) {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
export function setPref(key, value) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    /* private mode */
  }
}

export function wipePrefs() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("wwt.")) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
