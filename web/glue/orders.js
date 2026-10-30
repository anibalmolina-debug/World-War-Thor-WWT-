// @ts-check
import { budgetOf, emptyOrder, meterPct, meterState, normalizeOrder, RULES, validateOrder } from "/shared/js/rules.js";

/**
 * @param {any} store
 * @param {(k: string) => string} L
 * @param {any} nation
 */
export function ordersView(store, L, nation) {
  if (!nation) return `<section class="c-panel"><p>${L("dash.empty")}</p></section>`;
  const draft = store.orderDraft || emptyOrder();
  const units = (store.state.units || []).filter((u) => u.nationId === nation.id);
  const validation = validateOrder(nation, units, draft, {
    locked: store.orderMeta?.status === "submitted" || store.state.game.settings?.ordersLocked,
    reflectionRequired: store.state.game.settings?.reflectionRequired,
  });
  const locked = store.orderMeta?.status === "submitted" || store.state.game.settings?.ordersLocked;
  const meters = validation.meters;
  const force = units.reduce((acc, u) => {
    acc[u.type] = (acc[u.type] || 0) + 1;
    return acc;
  }, {});
  return `
    <section class="s-orders" data-state="${locked ? "locked" : store.orderMeta?.status || "draft"}">
      <div class="s-orders__form">
        <header class="s-dash__head">
          <div>
            <h1>${L("orders.title")}</h1>
            <p>${esc(nation.name)} · IC ${nation.ic} · NT $${nation.treasuryM}M · MP ${nation.manpower}</p>
          </div>
          <div class="s-orders__head-tools">
            ${
              store.state.viewer.role === "gm"
                ? `<label class="c-field s-dash__pick"><span>${L("dash.acting")}</span>
            <select class="c-select" data-action="select-nation">${store.state.nations
              .map((x) => `<option value="${esc(x.id)}" ${x.id === nation.id ? "selected" : ""}>${esc(x.name)}</option>`)
              .join("")}</select></label>`
                : ""
            }
            <p class="c-chip" data-state="${locked ? "late" : "ok"}">${L("orders.status." + (store.orderMeta?.status || "empty"))}</p>
          </div>
        </header>
        <section class="c-panel">
          <h2>${L("orders.force")}</h2>
          <p class="s-dash__legend">${Object.entries(force)
            .map(([k, v]) => `${k} ${v}`)
            .join(" · ") || L("dash.none")}</p>
        </section>
        <section class="c-panel">
          <h2>${L("orders.factory")}</h2>
          <p class="s-dash__legend">${L("orders.heavyNote")}</p>
          <div class="s-orders__builds">
            ${Object.entries(RULES.units)
              .map(([code, spec]) => {
                const n = draft.builds[code] || 0;
                const blocked = code === "ABD" && validation.errors.includes("airborne-air");
                return `<label class="c-stepper">
                  <span>${esc(spec.name)} <small>${code}${spec.heavy ? " · " + L("orders.heavy") : ""}</small>
                  <small>${spec.ic} IC · ${spec.mp} MP</small></span>
                  <span>
                    <button type="button" class="c-button" data-action="order-build" data-code="${code}" data-delta="-1" ${locked ? "disabled" : ""}>−</button>
                    <b>${n}</b>
                    <button type="button" class="c-button" data-action="order-build" data-code="${code}" data-delta="1" ${locked ? "disabled" : ""}>+</button>
                  </span>
                  ${blocked && n > 0 ? `<p class="c-field__error">${L("orders.airborneGate")}</p>` : ""}
                </label>`;
              })
              .join("")}
          </div>
          <label class="c-field">
            <span>${L("orders.fort")}</span>
            <span class="c-field__row c-field__row--split">
              <input class="c-input" data-order-field="fortification" type="number" min="0" value="${draft.fortification}" ${locked ? "disabled" : ""} />
              <input class="c-input" data-order-field="fortificationBorder" placeholder="${L("orders.border")}" value="${esc(draft.fortificationBorder)}" ${locked ? "disabled" : ""} />
            </span>
          </label>
        </section>
        <section class="c-panel">
          <h2>${L("orders.rd")}</h2>
          <div class="c-research-tree" role="tree">
            ${Object.entries(RULES.research.branches)
              .map(([id, branch]) => {
                const current = nation.research?.[id] || 0;
                const selected = draft.researchBranch === id;
                return `<div class="c-research-tree__branch" data-open="${selected || store.orderUi?.branch === id}">
                  <button type="button" class="c-research-tree__name" data-action="rd-open" data-branch="${id}">${esc(branch.name)} · ${current}/${RULES.research.maxLevel}</button>
                  <div class="c-research-tree__levels">
                    ${Array.from({ length: RULES.research.maxLevel }, (_, i) => i + 1)
                      .map((lv) => {
                        const wall = lv === branch.wall;
                        const on = selected && draft.researchTo === lv;
                        const owned = lv <= current;
                        return `<button type="button" class="c-research-tree__lv" data-action="rd-pick" data-branch="${id}" data-level="${lv}" data-wall="${wall}" aria-pressed="${on}" ${locked ? "disabled" : ""}>${lv}${wall ? " ▦" : ""}${owned ? " •" : ""}</button>`;
                      })
                      .join("")}
                  </div>
                </div>`;
              })
              .join("")}
          </div>
          <label class="c-field">
            <span>${L("orders.secret")}</span>
            <textarea class="c-textarea" data-order-field="secretProjects" ${locked ? "disabled" : ""}>${esc(draft.secretProjects)}</textarea>
          </label>
        </section>
        <section class="c-panel">
          <h2>${L("orders.home")}</h2>
          <div class="s-orders__builds">
            ${numStep("stabilityInitiatives", L("orders.stability"), draft.stabilityInitiatives, locked, "0–1")}
            ${numStep("factoryBuild", L("orders.factoryBuild"), draft.factoryBuild, locked)}
            ${numStep("relocateFactories", L("orders.relocate"), draft.relocateFactories, locked)}
            ${numStep("warBonds", L("orders.bonds"), draft.warBonds, locked, "max 2")}
          </div>
          <label class="c-field"><span>${L("orders.factoryLoc")}</span>
            <input class="c-input" data-order-field="factoryLocation" value="${esc(draft.factoryLocation)}" ${locked ? "disabled" : ""} />
          </label>
          <div class="s-dash__two">
            <label class="c-field"><span>${L("orders.from")}</span>
              <input class="c-input" data-order-field="relocateFrom" value="${esc(draft.relocateFrom)}" ${locked ? "disabled" : ""} />
            </label>
            <label class="c-field"><span>${L("orders.to")}</span>
              <input class="c-input" data-order-field="relocateTo" value="${esc(draft.relocateTo)}" ${locked ? "disabled" : ""} />
            </label>
          </div>
          <label class="c-field"><span>${L("orders.develop")}</span>
            <select class="c-select" data-order-field="developResource" ${locked ? "disabled" : ""}>
              <option value="">${L("orders.none")}</option>
              ${["oil", "food", "iron", "rubber", "tungsten"]
                .map((r) => `<option value="${r}" ${draft.developResource === r ? "selected" : ""}>${L("res." + r)}</option>`)
                .join("")}
            </select>
          </label>
        </section>
        <section class="c-panel">
          <h2>${L("orders.politics")}</h2>
          <label class="c-field"><span>${L("orders.campaign")} (${draft.politicalCampaignNt})</span>
            <input type="range" min="0" max="60" step="10" class="c-slider" data-order-field="politicalCampaignNt" value="${draft.politicalCampaignNt}" ${locked ? "disabled" : ""} />
          </label>
          <label class="c-field"><span>${L("orders.blockade")}</span>
            <select class="c-select" data-order-field="blockade" ${locked ? "disabled" : ""}>
              ${["none", "heavy", "tight", "lift"].map((b) => `<option value="${b}" ${draft.blockade === b ? "selected" : ""}>${L("orders.block." + b)}</option>`).join("")}
            </select>
          </label>
          <label class="c-check"><input type="checkbox" data-order-flag="lendLease" ${draft.lendLease ? "checked" : ""} ${locked ? "disabled" : ""}/> ${L("orders.lend")}</label>
          <label class="c-field"><span>${L("orders.standing")}</span>
            <select class="c-select" data-order-field="standingOrders" ${locked ? "disabled" : ""}>
              ${RULES.standingOrders.map((s) => `<option value="${s}" ${draft.standingOrders === s ? "selected" : ""}>${L("orders.stand." + s)}</option>`).join("")}
            </select>
          </label>
          <label class="c-field"><span>${L("orders.resistance")}</span>
            <textarea class="c-textarea" data-order-field="resistance" ${locked ? "disabled" : ""}>${esc(draft.resistance)}</textarea>
          </label>
        </section>
        <section class="c-panel">
          <h2>${L("orders.treasury")}</h2>
          <div class="s-orders__builds">
            ${numStep("otherNt", L("orders.otherNt"), draft.otherNt, locked)}
            ${numStep("proxyFunding", L("orders.proxy"), draft.proxyFunding, locked, "100–300")}
            ${numStep("volunteers", L("orders.volunteers"), draft.volunteers, locked, "$300M")}
            ${numStep("diplomacySpend", L("orders.dsBuy"), draft.diplomacySpend, locked)}
            ${numStep("espionageActions", L("orders.spy"), draft.espionageActions, locked, "3 IC")}
          </div>
        </section>
        <section class="c-panel">
          <h2>${L("orders.directives")}</h2>
          <label class="c-field"><span>${L("orders.military")}</span>
            <textarea class="c-textarea" data-order-field="militaryOrders" ${locked ? "disabled" : ""}>${esc(draft.militaryOrders)}</textarea>
          </label>
          <label class="c-field"><span>${L("orders.secretAct")}</span>
            <textarea class="c-textarea" data-order-field="secretActions" ${locked ? "disabled" : ""}>${esc(draft.secretActions)}</textarea>
          </label>
          ${
            store.state.game.settings?.reflectionRequired
              ? `<label class="c-field"><span>${L("orders.reflection")}</span>
            <textarea class="c-textarea" data-order-field="reflection" ${locked ? "disabled" : ""}>${esc(draft.reflection)}</textarea></label>`
              : ""
          }
        </section>
        ${
          validation.errors.length
            ? `<ul class="c-field__error" role="alert">${validation.errors.map((e) => `<li>${L("err." + e)}</li>`).join("")}</ul>`
            : ""
        }
        ${
          validation.warnings.length
            ? `<ul class="s-orders__warn">${validation.warnings.map((e) => `<li>${L("warn." + e)}</li>`).join("")}</ul>`
            : ""
        }
        <div class="s-orders__actions">
          <p class="s-dash__legend">${store.orderSave === "saving" ? L("orders.saving") : store.orderSave === "saved" ? L("orders.saved") : ""}</p>
          <button type="button" class="c-button" data-action="save-orders" ${locked ? "disabled" : ""}>${L("orders.save")}</button>
          <button type="button" class="c-button c-button--stamp" data-action="confirm-submit" ${locked || !validation.ok ? "disabled" : ""}>${L("orders.submit")}</button>
        </div>
      </div>
      <aside class="s-orders__meters" aria-label="${L("orders.meters")}">
        ${budgetMeter("I", L("stat.ic"), meters.ic, "ic")}
        ${budgetMeter("II", L("stat.nt"), meters.nt, "nt")}
        ${budgetMeter("III", L("stat.mp"), meters.mp, "mp")}
      </aside>
    </section>`;
}

export function liveValidation(store, nation) {
  const units = (store.state?.units || []).filter((u) => u.nationId === nation?.id);
  return validateOrder(nation, units, store.orderDraft || emptyOrder(), {
    locked: store.orderMeta?.status === "submitted" || store.state?.game?.settings?.ordersLocked,
    reflectionRequired: store.state?.game?.settings?.reflectionRequired,
  });
}

export { emptyOrder, normalizeOrder, budgetOf };

function budgetMeter(idx, label, meter, key) {
  const state = meterState(meter.used, meter.max);
  const pct = meterPct(meter.used, meter.max);
  return `<article class="c-panel c-meter-card">
    <p class="c-stat-plate__label">${idx}. ${esc(label)}</p>
    <p class="c-stat-plate__value">${meter.used} / ${meter.max}</p>
    <span class="c-meter c-meter--budget" data-state="${state}" data-pct="${pct}" data-meter="${key}"><i></i></span>
    <p class="c-stat-plate__hint">${meter.remaining} left</p>
  </article>`;
}

function numStep(field, label, value, locked, hint) {
  return `<label class="c-stepper"><span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ""}</span>
    <span>
      <button type="button" class="c-button" data-action="order-step" data-field="${field}" data-delta="-1" ${locked ? "disabled" : ""}>−</button>
      <b>${value}</b>
      <button type="button" class="c-button" data-action="order-step" data-field="${field}" data-delta="1" ${locked ? "disabled" : ""}>+</button>
    </span></label>`;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
