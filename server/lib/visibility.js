// @ts-check

/**
 * Core visibility filter.
 * @param {any} s - The global store.
 * @param {any} session - The current user session.
 * @param {string} targetNationId - The nation being checked.
 * @returns {boolean} True if the viewer can see secret data for the target.
 */
export function filterVisibility(s, session, targetNationId) {
  if (!session) return false;
  if (session.role === "gm") return true;
  return session.nationId === targetNationId;
}

/**
 * Filters a nation object based on visibility.
 */
export function visibleNation(n, viewerSession) {
  const isFull = filterVisibility(null, viewerSession, n.id);

  const base = {
    id: n.id,
    key: n.key,
    name: n.name,
    playable: n.playable,
    government: n.government,
    techRank: n.techRank,
  };

  if (!isFull) return base;

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

/**
 * Filters a unit object based on visibility.
 */
export function visibleUnit(u, viewerSession) {
  const isFull = filterVisibility(null, viewerSession, u.nationId);

  const base = {
    id: u.id,
    nationId: u.nationId,
    name: u.name,
    type: u.type,
    location: u.location,
    status: u.status,
  };

  if (!isFull) return base;

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

/**
 * Filters a colony object based on visibility.
 */
export function visibleColony(c, viewerSession) {
  const isFull = filterVisibility(null, viewerSession, c.nationId);

  const base = {
    id: c.id,
    nationId: c.nationId,
    name: c.name,
    status: c.status,
  };

  if (!isFull) return base;

  return {
    ...base,
    leader: c.leader,
    masterNationId: c.masterNationId,
    localIc: c.localIc,
    localNt: c.localNt,
    notes: c.notes,
  };
}
