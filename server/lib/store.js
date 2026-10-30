// @ts-check
import { envOr } from "./env.js";
import { decryptCodeword, encryptCodeword, hashSecret, hashToken } from "./crypto-box.js";
import { CORE_VERSION } from "./cipher.js";
import { normalizeOrder, validateOrder } from "../../shared/js/rules.js";
import { buildDemoSeed } from "./seed.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { filterVisibility, visibleNation, visibleUnit, visibleColony } from "./visibility.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rules = JSON.parse(readFileSync(join(__dirname, "../../shared/constants/rules.json"), "utf8"));

const RESOURCE_LEVELS = ["critical-deficit", "deficit", "balanced", "surplus", "extreme-surplus"];

function globalStore() {
  const g = /** @type {any} */ (globalThis);
  if (!g.__WWT_STORE) {
    g.__WWT_STORE = {
      ready: false,
      game: null,
      nations: [],
      units: [],
      colonies: [],
      chaosEvents: [],
      pacts: [],
      market: { note: "", prices: {} },
      telegrams: [],
      trades: [],
      treaties: [],
      orders: [],
      sessions: [],
      loginAttempts: [],
      eventLog: [],
      gmPasswordHash: "",
      snapshots: [],
      battleRows: [],
      reports: [],
    };
  }
  return g.__WWT_STORE;
}

export async function ensureStore() {
  const s = globalStore();
  if (s.ready) return s;
  const seed = await buildDemoSeed(envOr("SEED_STUDENT_CODEWORD", "kestrel"), envOr("SEED_GM_PASSWORD", "warcabinet"));
  Object.assign(s, seed);
  s.sessions = [];
  s.loginAttempts = [];
  s.eventLog = [];
  s.telegrams = [];
  s.trades = [];
  s.treaties = [];
  s.orders = s.orders || [];
  s.ready = true;
  appendEvent(s, "system", null, "seed", { nations: s.nations.length, units: s.units.length });
  return s;
}

export function appendEvent(s, actor, actAs, kind, payload) {
  s.eventLog.push({
    id: `ev-${s.eventLog.length + 1}`,
    gameId: s.game.id,
    season: s.game.season,
    actor,
    actAs,
    kind,
    payload,
    at: new Date().toISOString(),
  });
}

export function publicNation(n, full) {
  const base = {
    id: n.id,
    key: n.key,
    name: n.name,
    playable: n.playable,
    government: n.government,
    techRank: n.techRank,
  };
  if (!full) return base;
  return {
    ...base,
    ic: n.ic,
    treasuryM: n.treasuryM,
    manpower: n.manpower,
    stability: n.stability,
    diplomacy: n.diplomacy,
    atWar: n.atWar,
    uraniumAccess: n.uraniumAccess,
    militaryCapPct: n.militaryCapPct,
    seaTradePct: n.seaTradePct,
    neutrality: n.neutrality,
    resources: n.resources,
    tokens: n.tokens,
    deposits: n.deposits,
    research: n.research,
    factories: n.factories,
    version: n.version,
  };
}

function publicUnit(u, full) {
  const base = {
    id: u.id,
    nationId: u.nationId,
    name: u.name,
    type: u.type,
    location: u.location,
    status: u.status,
  };
  if (!full) return base;
  return {
    ...base,
    exp: u.exp,
    strPct: u.strPct,
    commander: u.commander,
    yearFormed: u.yearFormed,
    intelNote: u.intelNote,
    serviceRecord: u.serviceRecord,
  };
}

function publicColony(c, full) {
  const base = {
    id: c.id,
    nationId: c.nationId,
    name: c.name,
    status: c.status,
  };
  if (!full) return base;
  return {
    ...base,
    leader: c.leader,
    masterNationId: c.masterNationId,
    localIc: c.localIc,
    localNt: c.localNt,
    notes: c.notes,
  };
}

function canSeeFull(session, nationId) {
  if (!session) return false;
  if (session.role === "gm") return true;
  return session.nationId === nationId;
}

/**
 * @param {any} s
 * @param {{ role: string, nationId: string | null } | null} session
 */
export function visibleState(s, session) {
  const isGm = session?.role === "gm";
  const own = session?.nationId ? s.nations.find((n) => n.id === session.nationId) : null;
  const simpleView = Boolean(s.game.settings.simpleView) && !isGm;
  return {
    coreVersion: CORE_VERSION,
    cursor: s.eventLog.length,
    game: {
      id: s.game.id,
      week: s.game.week,
      season: s.game.season,
      seasonLabel: s.game.seasonLabel,
      tension: s.game.tension,
      crisisCount: s.game.crisisCount,
      settings: {
        simpleView: Boolean(s.game.settings.simpleView),
        reflectionRequired: Boolean(s.game.settings.reflectionRequired),
        ordersLocked: Boolean(s.game.settings.ordersLocked),
      },
    },
    viewer: session
      ? { role: session.role, nationId: session.nationId, nationName: own?.name || (isGm ? "Game Master" : null) }
      : null,
    nation: own ? visibleNation(own, session) : null,
    nations: s.nations.map((n) => visibleNation(n, session)),
    units: s.units.map((u) => visibleUnit(u, session)),
    colonies: s.colonies.map((c) => visibleColony(c, session)),
    chaosEvents: s.chaosEvents.filter((ev) => isGm || ev.scope === "global" || ev.nationId === own?.id),
    pacts: s.pacts.filter((p) => isGm || !p.secret),
    market: simpleView ? null : s.market,
    catalog: {
      units: rules.units,
      resources: ["oil", "food", "iron", "rubber", "tungsten"],
      resourceLevels: RESOURCE_LEVELS,
      integrity: rules.integrity,
      tokenCap: rules.tokenCapPerResource,
      research: rules.research,
      standingOrders: rules.standingOrders,
      costs: {
        stabilityInitiative: rules.stabilityInitiative,
        warBonds: rules.warBonds,
        fortification: rules.fortification,
        espionage: rules.espionage,
        factoryConstructionIc: rules.factoryConstructionIc,
        relocateFactoryIc: rules.relocateFactoryIc,
        politicalCampaign: rules.politicalCampaign,
        proxyFunding: rules.proxyFunding,
        volunteersNt: rules.volunteersNt,
        diplomacySpend: rules.diplomacySpend,
      },
    },
    badges: { treaties: 0, gm: 0 },
    news: ["BUNKER LINK ESTABLISHED", "DUTY OFFICER ON STATION", "MAP ROOM LAMPS LIT"],
    simpleView,
  };
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function tooManyAttempts(s, key) {
  const now = Date.now();
  s.loginAttempts = s.loginAttempts.filter((a) => now - a.at < WINDOW_MS);
  return s.loginAttempts.filter((a) => a.key === key && !a.ok).length >= MAX_ATTEMPTS;
}

export function recordAttempt(s, key, ok) {
  s.loginAttempts.push({ key, at: Date.now(), ok });
}

export function putSession(s, session) {
  s.sessions = s.sessions.filter((x) => x.tokenHash !== session.tokenHash);
  s.sessions.push(session);
}

export function getSession(s, token) {
  if (!token) return null;
  const hash = hashToken(token);
  const found = s.sessions.find((x) => x.tokenHash === hash);
  if (!found) return null;
  if (found.expiresAt < Date.now()) {
    s.sessions = s.sessions.filter((x) => x !== found);
    return null;
  }
  found.expiresAt = Date.now() + (found.role === "gm" ? 6 : 12) * 3600 * 1000;
  return found;
}

export function dropSession(s, token) {
  if (!token) return;
  const hash = hashToken(token);
  s.sessions = s.sessions.filter((x) => x.tokenHash !== hash);
}

export function resetStoreForTests() {
  const g = /** @type {any} */ (globalThis);
  g.__WWT_STORE = null;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Single write path. Every GM/student mutation goes through here.
 * @param {any} s
 * @param {{ actor: string, actAs?: string | null, kind: string, payload: any }} cmd
 */
export async function applyCommand(s, cmd) {
  const { kind, payload, actor, actAs } = cmd;
  if (kind === "nation.vitals") {
    const n = s.nations.find((x) => x.id === payload.id);
    if (!n) return { ok: false, status: 404, error: "nation" };
    if (payload.version != null && payload.version !== n.version) {
      return { ok: false, status: 409, error: "stale" };
    }
    if (payload.ic != null) n.ic = clamp(Number(payload.ic), 0, 99);
    if (payload.treasuryM != null) n.treasuryM = clamp(Number(payload.treasuryM), 0, 9999);
    if (payload.manpower != null) n.manpower = clamp(Number(payload.manpower), 0, 999);
    if (payload.stability != null) n.stability = clamp(Number(payload.stability), 0, 10);
    if (payload.diplomacy != null) n.diplomacy = clamp(Number(payload.diplomacy), 0, 10);
    if (payload.atWar != null) n.atWar = Boolean(payload.atWar);
    if (payload.uraniumAccess != null) n.uraniumAccess = Boolean(payload.uraniumAccess);
    if (payload.government) n.government = String(payload.government);
    if (payload.neutrality) n.neutrality = String(payload.neutrality);
    if (payload.militaryCapPct != null) n.militaryCapPct = clamp(Number(payload.militaryCapPct), 0, 100);
    if (payload.seaTradePct != null) n.seaTradePct = clamp(Number(payload.seaTradePct), 0, 100);
    if (payload.playable != null) {
      n.playable = Boolean(payload.playable);
      n.aiControlled = !n.playable;
    }
    if (payload.resources) {
      for (const [k, v] of Object.entries(payload.resources)) {
        if (RESOURCE_LEVELS.includes(v)) n.resources[k] = v;
      }
    }
    n.version += 1;
    appendEvent(s, actor, actAs || null, kind, { id: n.id, version: n.version });
    return { ok: true, nation: publicNation(n, true) };
  }
  if (kind === "order.save" || kind === "order.submit") {
    return saveOrder(s, cmd, kind === "order.submit");
  }
  if (kind === "nation.login") {
    const n = s.nations.find((x) => x.id === payload.id);
    if (!n) return { ok: false, status: 404, error: "nation" };
    const word = String(payload.codeword || "").trim().toLowerCase();
    if (!word) return { ok: false, status: 400, error: "codeword" };
    n.loginHash = await hashSecret(word);
    n.loginEnc = encryptCodeword(word);
    appendEvent(s, actor, actAs || null, kind, { id: n.id });
    return { ok: true };
  }
  if (kind === "trade.offer") {
    const trade = {
      id: `trd-${s.trades.length + 1}`,
      offererId: payload.offererId,
      offereeId: payload.offereeId,
      offer: payload.offer, // { resource: string, amount: number }
      request: payload.request, // { resource: string, amount: number }
      status: "offered",
      at: new Date().toISOString(),
    };
    s.trades.push(trade);
    appendEvent(s, actor, actAs || null, kind, { id: trade.id });
    return { ok: true, trade };
  }
  if (kind === "trade.respond") {
    const trade = s.trades.find(t => t.id === payload.id);
    if (!trade) return { ok: false, status: 404, error: "trade" };
    if (trade.status !== "offered") return { ok: false, status: 409, error: "invalid-state" };
    if (trade.offereeId !== payload.actorId) return { ok: false, status: 403, error: "unauthorized" };

    trade.status = payload.accept ? "accepted" : (payload.cancel ? "cancelled" : "declined");
    appendEvent(s, actor, actAs || null, kind, { id: trade.id, status: trade.status });
    return { ok: true, trade };
  }
  if (kind === "trade.settle") {
    const trade = s.trades.find(t => t.id === payload.id);
    if (!trade) return { ok: false, status: 404, error: "trade" };
    if (trade.status !== "accepted") return { ok: false, status: 409, error: "not-accepted" };

    const off = s.nations.find(n => n.id === trade.offererId);
    const offe = s.nations.find(n => n.id === trade.offereeId);
    if (!off || !offe) return { ok: false, status: 404, error: "nation" };

    if (off.tokens[trade.offer.resource] < trade.offer.amount) return { ok: false, status: 422, error: "insufficient-offerer" };
    if (offe.tokens[trade.request.resource] < trade.request.amount) return { ok: false, status: 422, error: "insufficient-offeree" };

    off.tokens[trade.offer.resource] -= trade.offer.amount;
    off.tokens[trade.request.resource] += trade.request.amount;
    offe.tokens[trade.request.resource] -= trade.request.amount;
    offe.tokens[trade.offer.resource] += trade.offer.amount;

    trade.status = "settled";
    appendEvent(s, actor, actAs || null, kind, { id: trade.id });
    return { ok: true, trade };
  }
  if (kind === "treaty.create") {
    const treaty = {
      id: `tre-${s.treaties.length + 1}`,
      type: payload.type,
      parties: payload.parties, // [nationId, ...]
      secret: Boolean(payload.secret),
      signatures: [], // [nationId, ...]
      at: new Date().toISOString(),
    };
    s.treaties.push(treaty);
    appendEvent(s, actor, actAs || null, kind, { id: treaty.id });
    return { ok: true, treaty };
  }
  if (kind === "treaty.sign") {
    const treaty = s.treaties.find(t => t.id === payload.id);
    if (!treaty) return { ok: false, status: 404, error: "treaty" };
    if (treaty.signatures.includes(payload.nationId)) return { ok: false, status: 409, error: "already-signed" };
    if (!treaty.parties.includes(payload.nationId)) return { ok: false, status: 403, error: "not-a-party" };

    treaty.signatures.push(payload.nationId);
    appendEvent(s, actor, actAs || null, kind, { id: treaty.id, nationId: payload.nationId });
    return { ok: true, treaty };
  }
  if (kind === "treaty.betray") {
    const treaty = s.treaties.find(t => t.id === payload.id);
    if (!treaty) return { ok: false, status: 404, error: "treaty" };
    if (!treaty.signatures.includes(payload.nationId)) return { ok: false, status: 403, error: "not-signed" };

    appendEvent(s, actor, actAs || null, "treaty.betrayal", { id: treaty.id, betrayer: payload.nationId });
    return { ok: true };
  }
  return { ok: false, status: 400, error: "unknown-command" };
}

function saveOrder(s, cmd, submit) {
  const { payload, actor, actAs } = cmd;
  const nation = s.nations.find((x) => x.id === payload.nationId);
  if (!nation) return { ok: false, status: 404, error: "nation" };
  const season = Number(payload.season);
  if (!Number.isInteger(season) || season < 1) return { ok: false, status: 400, error: "season" };
  const locked = Boolean(s.game.settings.ordersLocked);
  const units = s.units.filter((u) => u.nationId === nation.id);
  const check = validateOrder(nation, units, payload.payload, {
    locked: locked && actor !== "gm",
    reflectionRequired: Boolean(s.game.settings.reflectionRequired) && submit,
  });
  if (submit && !check.ok) {
    return { ok: false, status: 422, error: "invalid", validation: check };
  }

  // ponytail: simple check for reflection required here to ensure it is not bypassed by a draft-to-submit shift
  if (submit && Boolean(s.game.settings.reflectionRequired) && !String(check.order.reflection || "").trim()) {
    return { ok: false, status: 422, error: "reflection-required", validation: check };
  }

  // ponytail: lock orders on deadline (global setting)
  if (submit && Boolean(s.game.settings.ordersLocked) && actor !== "gm") {
    return { ok: false, status: 403, error: "locked", validation: check };
  }
  let row = s.orders.find((o) => o.nationId === nation.id && o.season === season);
  if (row && row.status === "submitted" && actor !== "gm") {
    return { ok: false, status: 409, error: "submitted" };
  }
  if (row && payload.version != null && payload.version !== row.version) {
    return { ok: false, status: 409, error: "stale" };
  }
  const nextPayload = check.order;
  if (!row) {
    row = {
      id: `ord-${nation.id}-${season}`,
      gameId: s.game.id,
      nationId: nation.id,
      season,
      status: "draft",
      payload: nextPayload,
      reflection: nextPayload.reflection,
      submittedAt: null,
      version: 1,
      history: [],
    };
    s.orders.push(row);
  } else {
    row.history = [...(row.history || []), { at: new Date().toISOString(), payload: row.payload }].slice(-8);
    row.payload = nextPayload;
    row.reflection = nextPayload.reflection;
    row.version += 1;
  }
  if (submit) {
    row.status = "submitted";
    row.submittedAt = new Date().toISOString();
  } else if (row.status !== "submitted") {
    row.status = "draft";
  }
  appendEvent(s, actor, actAs || null, cmd.kind, { nationId: nation.id, season, status: row.status, version: row.version });
  return { ok: true, order: publicOrder(row), validation: check };
}

export function findOrder(s, nationId, season) {
  return s.orders.find((o) => o.nationId === nationId && o.season === Number(season)) || null;
}

export function publicOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    nationId: row.nationId,
    season: row.season,
    status: row.status,
    payload: normalizeOrder(row.payload),
    submittedAt: row.submittedAt,
    version: row.version,
  };
}

export function listOrders(s, season) {
  return s.orders.filter((o) => o.season === Number(season)).map(publicOrder);
}

export function gmLogins(s) {
  return s.nations.map((n) => ({
    id: n.id,
    name: n.name,
    playable: n.playable,
    codeword: decryptCodeword(n.loginEnc),
  }));
}

export { RESOURCE_LEVELS };
