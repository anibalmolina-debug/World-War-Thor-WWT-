// @ts-check
/**
 * DOM command buffer applier. C++ (or the JS stand-in) emits ops; this file
 * must not contain game rules.
 *
 * Ops: { t: 'replace', html: string } | { t: 'attr', id, name, value } | { t: 'class', id, value }
 */

/**
 * @param {HTMLElement} root
 * @param {any[]} ops
 */
export function applyOps(root, ops) {
  for (const op of ops) {
    if (op.t === "replace") {
      root.innerHTML = op.html;
    } else if (op.t === "attr") {
      const node = root.querySelector(`[data-id="${cssEscape(op.id)}"]`);
      if (node) node.setAttribute(op.name, op.value);
    } else if (op.t === "class") {
      const node = root.querySelector(`[data-id="${cssEscape(op.id)}"]`);
      if (node) node.className = op.value;
    } else if (op.t === "text") {
      const node = root.querySelector(`[data-id="${cssEscape(op.id)}"]`);
      if (node) node.textContent = op.value;
    }
  }
}

function cssEscape(s) {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
  return String(s).replace(/"/g, '\\"');
}
