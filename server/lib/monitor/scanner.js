// ponytail: naive filter. Expand lists if false positives rise.
export const WORD_LISTS = {
  en: ["secret", "attack", "betray", "leak", "spy", "code", "nuclear"],
  es: ["secreto", "ataque", "traicionar", "filtrar", "espia", "codigo", "nuclear"],
};

export function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, " ");
}

export function scanMessage(text) {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  const flagged = [];

  for (const word of words) {
    if (!word) continue;
    for (const [lang, list] of Object.entries(WORD_LISTS)) {
      if (list.includes(word)) {
        flagged.push({ word, lang });
      }
    }
  }

  return {
    flagged,
    isFlagged: flagged.length > 0,
    normalized,
  };
}
