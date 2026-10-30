// @ts-check
/**
 * Season management.
 */

import { appendEvent } from "./store.js";

export async function advanceSeason(s, actor = "gm") {
  const currentSeason = s.game.season;

  // 1. Collect Taxes (simplified)
  for (const nation of s.nations) {
    // ponytail: naive tax: 10% of current treasury? Or fixed based on IC?
    const tax = Math.floor(nation.treasuryM * 0.1);
    nation.treasuryM += tax;
  }

  // 2. Advance Date
  s.game.season += 1;
  s.game.week = 1;

  // 3. Reset orders locking
  s.game.settings.ordersLocked = false;

  appendEvent(s, actor, null, "season.advance", { from: currentSeason, to: s.game.season });

  return { ok: true, season: s.game.season };
}

export async function undoFinalize(s, actor = "gm") {
  const lastSnap = s.snapshots[s.snapshots.length - 1];
  if (!lastSnap) return { ok: false, error: "no-snapshot" };

  const { state } = lastSnap;

  // Restore state
  s.nations = JSON.parse(JSON.stringify(state.nations));
  s.units = JSON.parse(JSON.stringify(state.units));
  s.colonies = JSON.parse(JSON.stringify(state.colonies));
  s.game = JSON.parse(JSON.stringify(state.game));

  // Remove the snapshot we just used
  s.snapshots.pop();

  appendEvent(s, actor, null, "season.undo", { season: lastSnap.season });

  return { ok: true };
}

export async function resetWeek(s, actor = "gm") {
  // ponytail: Resetting a week is effectively undoing to the start of the current week.
  // If snapshots are per-season, this might need more granularity.
  // For now, we treat it as undoing the last finalize.
  return undoFinalize(s, actor);
}
