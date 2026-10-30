// @ts-check
/**
 * Finalization engine.
 * Pipeline: snapshot -> lock orders -> apply builds -> apply spending -> apply research -> roll battles -> settle trades -> update tension -> build reports -> enqueue AI jobs -> event log.
 */

import { appendEvent } from "./store.js";
import { computeBattleOdds, resolveBattle, generateBattleSeed } from "./battle.js";

export async function finalizeSeason(s, actor = "gm") {
  const season = s.game.season;
  const gameId = s.game.id;

  // 1. Snapshot current state
  s.snapshots.push({
    id: `snap-${season}`,
    gameId,
    season,
    state: JSON.parse(JSON.stringify({
      nations: s.nations,
      units: s.units,
      colonies: s.colonies,
      game: s.game,
    })),
    createdAt: new Date().toISOString(),
  });

  // 2. Lock orders
  s.game.settings.ordersLocked = true;

  // 3. Apply Builds (Units)
  for (const nation of s.nations) {
    const order = s.orders.find(o => o.nationId === nation.id && o.season === season);
    if (!order) continue;

    const builds = order.payload.builds || {};
    for (const [code, count] of Object.entries(builds)) {
      if (count <= 0) continue;
      for (let i = 0; i < count; i++) {
        s.units.push({
          id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nationId: nation.id,
          name: `${nation.name} ${code} ${s.units.filter(u => u.type === code).length + 1}`,
          type: code,
          location: "capital",
          strPct: 100,
          status: "active",
        });
      }
    }
  }

  // 4. Apply Spending (simplified for now)
  // ponytail: spending logic handled in order validation (deducted at submit or here)
  // For now, we just log the spending event.

  // 5. Apply Research
  for (const nation of s.nations) {
    const order = s.orders.find(o => o.nationId === nation.id && o.season === season);
    if (!order || !order.payload.researchBranch) continue;

    const branch = order.payload.researchBranch;
    const target = order.payload.researchTo;
    nation.research = nation.research || {};
    nation.research[branch] = target;
    nation.techRank += 1;
  }

  // 6. Roll Battles
  // ponytail: placeholder for battle logic. It will read militaryOrders and generate battleRows.
  const battles = []; // In a real scenario, we'd derive this from militaryOrders
  s.battleRows = s.battleRows.filter(r => r.season !== season); // Clear old

  for (let i = 0; i < battles.length; i++) {
    const b = battles[i];
    const seed = generateBattleSeed(gameId, season, b.kind, i);
    const { attackerOdds, defenderOdds } = computeBattleOdds(b.attackers, b.defenders);
    const { winner, roll } = resolveBattle(seed, attackerOdds, defenderOdds);

    s.battleRows.push({
      id: `br-${Date.now()}-${i}`,
      gameId,
      season,
      kind: b.kind,
      participants: b.participants,
      odds: { attackerOdds, defenderOdds },
      seed,
      roll,
      result: { winner },
      status: "resolved",
    });
  }

  // 7. Settle Trades
  // ponytail: placeholder for trade settlement

  // 8. Update Tension
  s.game.tension += 5; // Naive increment

  // 9. Build Reports
  for (const nation of s.nations) {
    s.reports.push({
      id: `rep-${Date.now()}-${nation.id}`,
      gameId,
      season,
      kind: "season-summary",
      nationId: nation.id,
      body: `Season ${season} summary for ${nation.name}.`,
      data: { season },
    });
  }

  // 10. Enqueue AI Jobs
  // ponytail: logic to add to ai_requests table

  appendEvent(s, actor, null, "season.finalize", { season });

  return { ok: true, season };
}
