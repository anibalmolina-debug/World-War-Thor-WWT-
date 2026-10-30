// @ts-check
/** JS twin of core BudgetCalculator + OrderValidator until wwt_core.wasm is built. */
import rulesJson from "../constants/rules.json" with { type: "json" };

export const CORE_VERSION = rulesJson.coreVersion;
export const RULES = rulesJson;

const UNIT_KEYS = Object.keys(rulesJson.units);
const LEVELS = rulesJson.resourceLevels;

/**
 * @returns {Record<string, any>}
 */
export function emptyOrder() {
  /** @type {Record<string, number>} */
  const builds = {};
  for (const k of UNIT_KEYS) builds[k] = 0;
  return {
    builds,
    fortification: 0,
    fortificationBorder: "",
    researchBranch: "",
    researchTo: 0,
    secretProjects: "",
    stabilityInitiatives: 0,
    factoryBuild: 0,
    factoryLocation: "",
    relocateFactories: 0,
    relocateFrom: "",
    relocateTo: "",
    developResource: "",
    warBonds: 0,
    politicalCampaignNt: 0,
    blockade: "none",
    lendLease: false,
    standingOrders: "balanced",
    resistance: "",
    militaryOrders: "",
    secretActions: "",
    otherNt: 0,
    proxyFunding: 0,
    volunteers: 0,
    diplomacySpend: 0,
    espionageActions: 0,
    reflection: "",
  };
}

/**
 * @param {Record<string, any>} raw
 */
export function normalizeOrder(raw) {
  const base = emptyOrder();
  if (!raw || typeof raw !== "object") return base;
  const builds = { ...base.builds };
  if (raw.builds && typeof raw.builds === "object") {
    for (const k of UNIT_KEYS) builds[k] = clampInt(raw.builds[k], 0, 99);
  }
  return {
    ...base,
    ...pickStr(raw, [
      "fortificationBorder",
      "researchBranch",
      "secretProjects",
      "factoryLocation",
      "relocateFrom",
      "relocateTo",
      "developResource",
      "blockade",
      "standingOrders",
      "resistance",
      "militaryOrders",
      "secretActions",
      "reflection",
    ]),
    builds,
    fortification: clampInt(raw.fortification, 0, 20),
    researchTo: clampInt(raw.researchTo, 0, RULES.research.maxLevel),
    stabilityInitiatives: clampInt(raw.stabilityInitiatives, 0, 1),
    factoryBuild: clampInt(raw.factoryBuild, 0, 20),
    relocateFactories: clampInt(raw.relocateFactories, 0, 20),
    warBonds: clampInt(raw.warBonds, 0, 9),
    politicalCampaignNt: clampInt(raw.politicalCampaignNt, 0, 200),
    otherNt: clampInt(raw.otherNt, 0, 9999),
    proxyFunding: clampInt(raw.proxyFunding, 0, 9999),
    volunteers: clampInt(raw.volunteers, 0, 1),
    diplomacySpend: clampInt(raw.diplomacySpend, 0, 20),
    espionageActions: clampInt(raw.espionageActions, 0, 9),
    lendLease: Boolean(raw.lendLease),
    blockade: ["none", "heavy", "tight", "lift"].includes(raw.blockade) ? raw.blockade : "none",
    standingOrders: RULES.standingOrders.includes(raw.standingOrders) ? raw.standingOrders : "balanced",
  };
}

/**
 * @param {any} nation
 * @param {any[]} units
 * @param {Record<string, any>} order
 */
export function budgetOf(nation, units, order) {
  const o = normalizeOrder(order);
  const lines = [];
  let ic = 0;
  let nt = 0;
  let mp = 0;

  for (const [code, spec] of Object.entries(RULES.units)) {
    const n = o.builds[code] || 0;
    if (!n) continue;
    const icCost = spec.ic * n;
    const mpCost = spec.mp * n;
    ic += icCost;
    mp += mpCost;
    lines.push({ id: "build-" + code, ic: icCost, mp: mpCost, nt: 0, note: spec.name + " ×" + n });
  }

  if (o.fortification) {
    const icCost = RULES.fortification.ic * o.fortification;
    ic += icCost;
    lines.push({ id: "fort", ic: icCost, mp: 0, nt: 0, note: "Fortification" });
  }
  if (o.researchBranch) {
    ic += RULES.research.icPerLevel;
    lines.push({ id: "rd", ic: RULES.research.icPerLevel, mp: 0, nt: 0, note: "R&D " + o.researchBranch });
  }
  if (o.stabilityInitiatives) {
    const icCost = RULES.stabilityInitiative.ic * o.stabilityInitiatives;
    ic += icCost;
    lines.push({ id: "ns", ic: icCost, mp: 0, nt: 0, note: "Stability initiative" });
  }
  if (o.factoryBuild) {
    const icCost = RULES.factoryConstructionIc * o.factoryBuild;
    ic += icCost;
    lines.push({ id: "factory", ic: icCost, mp: 0, nt: 0, note: "Factory construction" });
  }
  if (o.relocateFactories) {
    const icCost = RULES.relocateFactoryIc * o.relocateFactories;
    ic += icCost;
    lines.push({ id: "relocate", ic: icCost, mp: 0, nt: 0, note: "Relocate factories" });
  }
  if (o.developResource) {
    const cost = developCost(nation, o.developResource);
    if (cost != null) {
      ic += cost;
      lines.push({ id: "develop", ic: cost, mp: 0, nt: 0, note: "Develop " + o.developResource });
    }
  }
  if (o.espionageActions) {
    const icCost = RULES.espionage.icPerAction * o.espionageActions;
    ic += icCost;
    lines.push({ id: "spy", ic: icCost, mp: 0, nt: 0, note: "Espionage" });
  }
  if (o.warBonds) {
    const ntCost = RULES.warBonds.nt * o.warBonds;
    nt += ntCost;
    lines.push({ id: "bonds", ic: 0, mp: 0, nt: ntCost, note: "War bonds" });
  }
  if (o.politicalCampaignNt) {
    nt += o.politicalCampaignNt;
    lines.push({ id: "campaign", ic: 0, mp: 0, nt: o.politicalCampaignNt, note: "Political campaign" });
  }
  if (o.otherNt) {
    nt += o.otherNt;
    lines.push({ id: "other", ic: 0, mp: 0, nt: o.otherNt, note: "Other NT" });
  }
  if (o.proxyFunding) {
    nt += o.proxyFunding;
    lines.push({ id: "proxy", ic: 0, mp: 0, nt: o.proxyFunding, note: "Proxy funding" });
  }
  if (o.volunteers) {
    nt += RULES.volunteersNt;
    lines.push({ id: "volunteers", ic: 0, mp: 0, nt: RULES.volunteersNt, note: "Volunteers" });
  }
  if (o.diplomacySpend) {
    const ntCost = RULES.diplomacySpend.nt * o.diplomacySpend;
    nt += ntCost;
    lines.push({ id: "ds", ic: 0, mp: 0, nt: ntCost, note: "Diplomacy" });
  }

  void units;
  const cap = nation.ic ?? 0;
  const treasury = nation.treasuryM ?? 0;
  const manpower = nation.manpower ?? 0;
  return {
    ic: { used: ic, max: cap, remaining: cap - ic },
    nt: { used: nt, max: treasury, remaining: treasury - nt },
    mp: { used: mp, max: manpower, remaining: manpower - mp },
    lines,
  };
}

/**
 * @param {any} nation
 * @param {any[]} units
 * @param {Record<string, any>} order
 * @param {{ reflectionRequired?: boolean, locked?: boolean }} [ctx]
 */
export function validateOrder(nation, units, order, ctx = {}) {
  const o = normalizeOrder(order);
  const meters = budgetOf(nation, units, o);
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (ctx.locked) errors.push("locked");
  if (meters.ic.remaining < 0) errors.push("ic-overspend");
  if (meters.nt.remaining < 0) errors.push("nt-overspend");
  if (meters.mp.remaining < 0) errors.push("mp-overspend");

  if (o.stabilityInitiatives > RULES.stabilityInitiative.maxPerSeason) errors.push("stability-cap");
  if ((nation.stability ?? 0) + o.stabilityInitiatives > RULES.stabilityMax) errors.push("stability-max");
  if (o.warBonds > RULES.warBonds.maxPerSeason) errors.push("war-bonds-cap");
  if (o.politicalCampaignNt > RULES.politicalCampaign.maxNt) errors.push("campaign-cap");
  if (o.politicalCampaignNt % RULES.politicalCampaign.per !== 0) errors.push("campaign-step");
  if (o.proxyFunding && (o.proxyFunding < RULES.proxyFunding.minNt || o.proxyFunding > RULES.proxyFunding.maxNt)) {
    errors.push("proxy-range");
  }
  if (o.fortification > 0 && !String(o.fortificationBorder || "").trim()) errors.push("fort-border");
  if (o.developResource) {
    const cost = developCost(nation, o.developResource);
    if (cost == null) errors.push("develop-invalid");
  }
  if (o.relocateFactories > factoryCount(nation)) errors.push("relocate-count");

  const research = nation.research || {};
  if (o.researchBranch) {
    const branch = RULES.research.branches[o.researchBranch];
    if (!branch) errors.push("research-branch");
    else {
      const current = Number(research[o.researchBranch] || 0);
      if (o.researchTo !== current + 1) errors.push("research-step");
      if (o.researchTo > RULES.research.maxLevel) errors.push("research-max");
      if (o.researchTo === branch.wall) warnings.push("research-wall");
    }
  } else if (o.researchTo) {
    errors.push("research-branch");
  }

  const intel = effectiveLevel(research.intel, o, "intel");
  const unlocked = RULES.espionage.unlockLevels.filter((lv) => intel >= lv).length;
  if (o.espionageActions > RULES.espionage.maxActions) errors.push("spy-cap");
  if (o.espionageActions > unlocked) errors.push("spy-locked");

  const abd = o.builds.ABD || 0;
  if (abd > 0) {
    const air = effectiveLevel(research.air, o, "air");
    const spec = RULES.units.ABD;
    if (air < spec.requiresAirRd) errors.push("airborne-air");
    if (!hasBomberWing(units, o)) errors.push("airborne-bomber");
  }

  let unitIc = 0;
  for (const [code, spec] of Object.entries(RULES.units)) {
    unitIc += spec.ic * (o.builds[code] || 0);
    if (spec.heavy && (o.builds[code] || 0) > 0) warnings.push("heavy-" + code);
  }
  const milCap = Number(nation.militaryCapPct ?? 100);
  if (nation.ic > 0 && unitIc * 100 > nation.ic * milCap) errors.push("military-cap");

  if (ctx.reflectionRequired && !String(o.reflection || "").trim()) errors.push("reflection");

  if (meters.ic.used / Math.max(1, meters.ic.max) >= 0.8 && meters.ic.remaining >= 0) warnings.push("ic-tight");
  if (meters.nt.used / Math.max(1, meters.nt.max) >= 0.8 && meters.nt.remaining >= 0) warnings.push("nt-tight");
  if (meters.mp.used / Math.max(1, meters.mp.max) >= 0.8 && meters.mp.remaining >= 0) warnings.push("mp-tight");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    meters,
    order: o,
  };
}

function developCost(nation, resource) {
  if (!LEVELS.includes(nation.resources?.[resource])) {
    const untapped = (nation.deposits || []).some((d) => String(d).toLowerCase().includes(resource));
    if (untapped) return RULES.developResource.cheapIc;
    return null;
  }
  const idx = LEVELS.indexOf(nation.resources[resource]);
  if (idx >= LEVELS.length - 1) return null;
  const cheapUntil = LEVELS.indexOf(RULES.developResource.cheapUpTo);
  return idx <= cheapUntil ? RULES.developResource.cheapIc : RULES.developResource.expensiveIc;
}

function factoryCount(nation) {
  if (typeof nation.factoryCount === "number") return nation.factoryCount;
  return (nation.factories || []).reduce((n, f) => n + Number(f.count || 0), 0);
}

function hasBomberWing(units, order) {
  if ((order.builds.BW || 0) > 0) return true;
  return (units || []).some((u) => u.type === "BW" && u.status !== "disbanded");
}

function effectiveLevel(current, order, branch) {
  const n = Number(current || 0);
  if (order.researchBranch === branch && order.researchTo === n + 1) return order.researchTo;
  return n;
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function pickStr(raw, keys) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const k of keys) out[k] = raw[k] == null ? "" : String(raw[k]);
  return out;
}

export function meterState(used, max) {
  if (used > max) return "over";
  if (max > 0 && used / max >= 0.8) return "warn";
  return "ok";
}

export function meterPct(used, max) {
  if (max <= 0) return used > 0 ? 100 : 0;
  return Math.min(100, Math.round((used / max) * 20) * 5);
}

export { UNIT_KEYS, LEVELS };
