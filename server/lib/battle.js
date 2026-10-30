// @ts-check
/**
 * Battle engine for WWT resolution.
 * Handle odds computation and seeded dice rolls.
 */

import { crypto } from "node:crypto";

/**
 * @typedef {Object} BattleRow
 * @property {string} id
 * @property {string} gameId
 * @property {number} season
 * @property {string} kind
 * @property {any[]} participants
 * @property {Record<string, number>} odds
 * @property {string} seed
 * @property {Record<string, number>} roll
 * @property {Record<string, any>} result
 * @property {string} status
 */

/**
 * Linear Congruential Generator for seeded rolls.
 * ponytail: simple LCG for deterministic results without full crypto overhead.
 */
class SeededRandom {
  constructor(seed) {
    this.state = this._hashSeed(seed);
  }

  _hashSeed(seed) {
    const hash = crypto.createHash("sha256").update(seed).digest();
    return hash.readUInt32BE(0);
  }

  next() {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  rollD6() {
    return this.nextInt(1, 6);
  }
}

/**
 * Computes the odds for a battle based on unit strength and modifiers.
 * @param {any[]} attackerUnits
 * @param {any[]} defenderUnits
 * @param {Record<string, any>} modifiers
 * @returns {{ attackerOdds: number, defenderOdds: number }}
 */
export function computeBattleOdds(attackerUnits, defenderUnits, modifiers = {}) {
  const sumStr = (units) => units.reduce((acc, u) => acc + (u.strPct || 100), 0);

  const attackerStr = sumStr(attackerUnits);
  const defenderStr = sumStr(defenderUnits);

  // ponytail: naive linear odds. Upgrade to non-linear if balance requires.
  const total = attackerStr + defenderStr;
  if (total === 0) return { attackerOdds: 0.5, defenderOdds: 0.5 };

  return {
    attackerOdds: attackerStr / total,
    defenderOdds: defenderStr / total,
  };
}

/**
 * Executes the battle roll using the provided seed.
 * @param {string} seed
 * @param {number} attackerOdds
 * @param {number} defenderOdds
 * @returns {{ winner: string, roll: number }}
 */
export function resolveBattle(seed, attackerOdds, defenderOdds) {
  const rng = new SeededRandom(seed);
  const roll = rng.next();

  return {
    winner: roll < attackerOdds ? "attacker" : "defender",
    roll: roll,
  };
}

/**
 * Generates a unique seed for a battle row.
 * @param {string} gameId
 * @param {number} season
 * @param {string} kind
 * @param {string} index
 */
export function generateBattleSeed(gameId, season, kind, index) {
  return crypto.createHash("sha256")
    .update(`${gameId}:${season}:${kind}:${index}`)
    .digest("hex");
}
