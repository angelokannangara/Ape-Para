// Applies database/schema.sql and database/seed.sql (both idempotent).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database');
for (const file of ['schema.sql', 'seed.sql']) {
  await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
  console.log(`applied ${file}`);
}
await pool.end();
