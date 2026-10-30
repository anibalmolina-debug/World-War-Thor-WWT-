import { db } from './server/lib/db.js';
import fs from 'fs/promises';
import path from 'path';

async function migrate() {
  const migrationsDir = './server/migrations';
  const files = (await fs.readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    console.log(Applying ...);
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await db.query(sql);
  }
  console.log('Migrations complete.');
}

migrate().catch(console.error);