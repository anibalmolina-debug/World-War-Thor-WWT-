// @ts-check
import en from "../data/i18n/en.json" with { type: "json" };
import es from "../data/i18n/es.json" with { type: "json" };

const tables = { en, es };

/**
 * @param {'en' | 'es'} lang
 * @param {string} key
 */
export function t(lang, key) {
  const table = tables[lang] || tables.en;
  return table[key] || tables.en[key] || key;
}
