import { db } from '../server/lib/db.js';

async function seed() {
  const gameId = '00000000-0000-0000-0000-000000000001'; // Demo fixed ID
  
  await db.query('INSERT INTO games (id, name, tension) VALUES (, , ) ON CONFLICT (id) DO NOTHING', [gameId, 'Demo War 1939', 40]);
  
  const nations = [
    { key: 'germany', name: 'Germany', ic: 14, treasury: 300, manpower: 25, stability: 8, diplomacy: 4, tech: 2 },
    { key: 'uk', name: 'United Kingdom', ic: 12, treasury: 400, manpower: 30, stability: 9, diplomacy: 8, tech: 3 },
  ];

  for (const n of nations) {
    await db.query(
      INSERT INTO nations (game_id, key, name, ic, treasury_m, manpower, stability, diplomacy, tech_rank) 
      VALUES (, , , , , , , , ) ON CONFLICT (game_id, key) DO NOTHING, 
      [gameId, n.key, n.name, n.ic, n.treasury, n.manpower, n.stability, n.diplomacy, n.tech]);
  }
  console.log('Seed complete.');
}

seed().catch(console.error);