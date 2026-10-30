// @ts-check
import { encryptCodeword, hashSecret } from "./crypto-box.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rules = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../shared/constants/rules.json"), "utf8"),
);

/**
 * @param {string} studentWord
 * @param {string} gmPass
 */
export async function buildDemoSeed(studentWord, gmPass) {
  const germanyHash = await hashSecret(studentWord);
  const britainHash = await hashSecret("dover");
  const franceHash = await hashSecret("unused");

  const nations = [
    nation("n-ger", "germany", "Germany", true, germanyHash, studentWord, {
      ic: 14,
      treasuryM: 300,
      manpower: 25,
      stability: 8,
      diplomacy: 4,
      techRank: 2,
      government: "fascism",
      resources: { oil: "balanced", food: "surplus", iron: "surplus", rubber: "deficit", tungsten: "balanced" },
      tokens: { oil: 1, food: 0, iron: 2, rubber: 0, tungsten: 0 },
      deposits: ["Uranium ore", "Deep coal"],
      research: { air: 2, armor: 2, navy: 1, industry: 2, logistics: 1, diplomacy: 1, intel: 0 },
      factories: [
        { location: "Ruhr", count: 4 },
        { location: "Silesia", count: 2 },
      ],
    }),
    nation("n-uk", "britain", "United Kingdom", true, britainHash, "dover", {
      ic: 12,
      treasuryM: 280,
      manpower: 18,
      stability: 7,
      diplomacy: 6,
      techRank: 2,
      government: "democracy",
      resources: { oil: "deficit", food: "balanced", iron: "balanced", rubber: "surplus", tungsten: "deficit" },
      tokens: { oil: 0, food: 1, iron: 0, rubber: 1, tungsten: 0 },
      deposits: ["North Sea coal"],
      research: { air: 3, armor: 1, navy: 3, industry: 2, logistics: 2, diplomacy: 2, intel: 2 },
      factories: [{ location: "Midlands", count: 5 }],
    }),
    nation("n-fr", "france", "France", false, franceHash, "unused", {
      ic: 10,
      treasuryM: 200,
      manpower: 16,
      stability: 6,
      diplomacy: 5,
      techRank: 2,
      government: "democracy",
      playable: false,
      resources: { oil: "deficit", food: "surplus", iron: "balanced", rubber: "balanced", tungsten: "deficit" },
      deposits: ["Bauxite"],
      research: { air: 2, armor: 1, navy: 1, industry: 1, logistics: 1, diplomacy: 2, intel: 0 },
      factories: [{ location: "Lorraine", count: 3 }],
    }),
  ];

  const units = [
    unit("u-ger-1", "n-ger", "1st Panzer Division", "AD", "veteran", "Berlin", 92, "Heinz Guderian", 1935, "Spearhead armour of the Reich."),
    unit("u-ger-2", "n-ger", "2nd Panzer Division", "AD", "seasoned", "Breslau", 81, "Rudolf Veiel", 1935, "Ready for a Polish frontier dash."),
    unit("u-ger-3", "n-ger", "1st Infantry Division", "ID", "seasoned", "Königsberg", 100, "Joachim von Kortzfleisch", 1934, "East Prussian line infantry."),
    unit("u-ger-4", "n-ger", "3rd Infantry Division", "ID", "recruit", "Frankfurt", 76, "Walter Petzel", 1934, "Still forming cadres."),
    unit("u-ger-5", "n-ger", "Luftflotte 2", "FW", "seasoned", "Braunschweig", 88, "Hellmuth Felmy", 1939, "Home defence fighters."),
    unit("u-ger-6", "n-ger", "Kampfgeschwader 1", "BW", "recruit", "Cottbus", 64, "Ulrich Kessler", 1935, "Heavy bombers still training."),
    unit("u-uk-1", "n-uk", "1st Infantry Division", "ID", "veteran", "Aldershot", 95, "Harold Alexander", 1938, "Regular army backbone."),
    unit("u-uk-2", "n-uk", "Royal Navy Home Fleet", "NF", "elite", "Scapa Flow", 90, "Charles Forbes", 1939, "Capital ships on northern watch."),
    unit("u-uk-3", "n-uk", "Fighter Command 11 Group", "FW", "seasoned", "Uxbridge", 84, "Keith Park", 1936, "Channel fighter screen."),
    unit("u-fr-1", "n-fr", "1re Armée", "ID", "seasoned", "Lille", 70, "Georges Blanchard", 1939, "Facing the Belgian frontier."),
  ];

  const colonies = [
    colony("c-ger-1", "n-ger", "Bohemia and Moravia", "protectorate", "Konstantin von Neurath", null, 2, 20, "Occupied Czech lands, 1939."),
    colony("c-uk-1", "n-uk", "British India", "colony", "Linlithgow", null, 4, 40, "Imperial manpower and tax base."),
    colony("c-uk-2", "n-uk", "Egypt", "mandate", "Lampson", null, 1, 12, "Suez and desert staging."),
    colony("c-fr-1", "n-fr", "French Algeria", "colony", "Le Beau", null, 2, 18, "North African départements."),
  ];

  const chaosEvents = [
    { id: "ch-1", gameId: "game-demo", scope: "local", nationId: "n-ger", text: "Rhineland factory slowdown", effects: ["−1 IC this season if unresolved"], active: true },
    { id: "ch-2", gameId: "game-demo", scope: "global", nationId: null, text: "Spanish Civil War aftershocks", effects: ["World tension +0", "Volunteer opportunities"], active: true },
  ];

  const pacts = [
    { id: "p-1", type: "defensive-alliance", secret: false, parties: ["n-uk", "n-fr"], terms: "Anglo-French Entente", status: "active" },
  ];

  return {
    game: {
      id: "game-demo",
      name: "1939 Cabinet Exercise",
      week: 1,
      season: 1,
      seasonLabel: rules.startDateLabel,
      tension: 40,
      crisisCount: 1,
      status: "active",
      settings: { simpleView: false, reflectionRequired: false, ordersLocked: false },
      createdAt: new Date().toISOString(),
    },
    nations,
    units,
    colonies,
    chaosEvents,
    pacts,
    market: {
      note: "World Market board — excess tokens must be sold (cap 2 per resource).",
      prices: { oil: 12, food: 8, iron: 10, rubber: 14, tungsten: 16 },
    },
    gmPasswordHash: await hashSecret(gmPass),
  };
}

function nation(id, key, name, playable, loginHash, codeword, extra) {
  return {
    id,
    gameId: "game-demo",
    key,
    name,
    playable: extra.playable ?? playable,
    aiControlled: !(extra.playable ?? playable),
    loginHash,
    loginEnc: encryptCodeword(codeword),
    government: extra.government,
    neutrality: extra.neutrality || "none",
    ic: extra.ic,
    treasuryM: extra.treasuryM,
    manpower: extra.manpower,
    stability: extra.stability,
    diplomacy: extra.diplomacy,
    techRank: extra.techRank,
    atWar: extra.atWar || false,
    uraniumAccess: extra.uraniumAccess || false,
    militaryCapPct: extra.militaryCapPct ?? 100,
    seaTradePct: extra.seaTradePct ?? 100,
    resources: extra.resources,
    tokens: extra.tokens || { oil: 0, food: 0, iron: 0, rubber: 0, tungsten: 0 },
    deposits: extra.deposits || [],
    research: extra.research || {
      air: 0,
      armor: 0,
      navy: 0,
      industry: 0,
      logistics: 0,
      diplomacy: 0,
      intel: 0,
    },
    factories: extra.factories || [],
    version: 1,
  };
}

function unit(id, nationId, name, type, exp, location, strPct, commander, yearFormed, intelNote) {
  return {
    id,
    nationId,
    name,
    type,
    exp,
    location,
    strPct,
    commander,
    yearFormed,
    intelNote,
    status: "active",
    serviceRecord: `${yearFormed}–present · ${location}`,
  };
}

function colony(id, nationId, name, status, leader, masterNationId, localIc, localNt, notes) {
  return { id, nationId, name, status, leader, masterNationId, localIc, localNt, notes };
}
