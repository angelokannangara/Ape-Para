// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-password' npm run create-admin
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars).');
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
await pool.query(
  `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')
   ON CONFLICT ((lower(email))) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
  [email, hash],
);
console.log(`Admin ready: ${email}`);
await pool.end();
