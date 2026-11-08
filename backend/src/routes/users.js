import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

const staffSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['field_worker', 'admin']),
  departmentId: z.string().uuid().optional(),
}).refine((v) => v.role !== 'field_worker' || v.departmentId, {
  message: 'departmentId is required for field workers', path: ['departmentId'],
});

// Admin-only: create field-worker / admin accounts (public registration only makes citizens).
router.post('/staff', async (req, res, next) => {
  try {
    const d = staffSchema.parse(req.body);
    const hash = await bcrypt.hash(d.password, 12);
    try {
      const { rows } = await query(
        `INSERT INTO users (email, password_hash, full_name, role, department_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, department_id`,
        [d.email, hash, d.fullName ?? null, d.role, d.departmentId ?? null],
      );
      res.status(201).json({ user: rows[0] });
    } catch (err) {
      if (err.code === '23505') throw new HttpError(409, 'An account with this email already exists');
      if (err.code === '23503') throw new HttpError(400, 'Unknown departmentId');
      throw err;
    }
  } catch (err) { next(err); }
});

export default router;
