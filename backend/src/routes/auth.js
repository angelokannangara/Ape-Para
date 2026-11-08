import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});
const registerSchema = credentials.extend({ fullName: z.string().trim().min(1).max(100).optional() });

const publicUser = (u) => ({
  id: u.id, email: u.email, fullName: u.full_name, role: u.role, departmentId: u.department_id,
});

// Public registration ALWAYS creates a citizen. Staff accounts are created by admins (see /api/users/staff).
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName } = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 12);
    try {
      const { rows } = await query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, 'citizen') RETURNING *`,
        [email, hash, fullName ?? null],
      );
      res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
    } catch (err) {
      if (err.code === '23505') throw new HttpError(409, 'An account with this email already exists');
      throw err;
    }
  } catch (err) { next(err); }
});

// Pre-computed hash so unknown emails cost the same time as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentials.parse(req.body);
    const { rows } = await query('SELECT * FROM users WHERE lower(email) = $1', [email]);
    const user = rows[0];
    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, 'Incorrect email or password');
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) throw new HttpError(401, 'Account no longer exists');
    res.json({ user: publicUser(rows[0]) });
  } catch (err) { next(err); }
});

export default router;
