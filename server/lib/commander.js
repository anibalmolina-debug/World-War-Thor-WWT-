// @ts-check
/**
 * GM Unit Commander tools.
 */

export async function commissionUnit(s, { nationId, type, location, commander }) {
  s.units.push({
    id: `u-gm-${Date.now()}`,
    nationId,
    name: `Commissioned ${type}`,
    type,
    location,
    commander,
    strPct: 100,
    status: "active",
  });
  return { ok: true };
}

export async function moveUnit(s, { unitId, location }) {
  const u = s.units.find(u => u.id === unitId);
  if (!u) return { ok: false, error: "unit-not-found" };
  u.location = location;
  return { ok: true };
}

export async function damageUnit(s, { unitId, amount }) {
  const u = s.units.find(u => u.id === unitId);
  if (!u) return { ok: false, error: "unit-not-found" };
  u.strPct = Math.max(0, (u.strPct || 100) - amount);
  return { ok: true };
}

export async function healUnit(s, { unitId, amount }) {
  const u = s.units.find(u => u.id === unitId);
  if (!u) return { ok: false, error: "unit-not-found" };
  u.strPct = Math.min(100, (u.strPct || 100) + amount);
  return { ok: true };
}

export async function disbandUnit(s, { unitId }) {
  const idx = s.units.findIndex(u => u.id === unitId);
  if (idx === -1) return { ok: false, error: "unit-not-found" };
  s.units[idx].status = "disbanded";
  return { ok: true };
}
