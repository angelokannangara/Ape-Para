import { Router } from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, report_id, message, read_at, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id],
    );
    res.json({
      notifications: rows.map((n) => ({
        id: n.id, reportId: n.report_id, message: n.message,
        read: n.read_at !== null, createdAt: n.created_at,
      })),
      unread: rows.filter((n) => n.read_at === null).length,
    });
  } catch (err) { next(err); }
});

router.post('/read', async (req, res, next) => {
  try {
    await query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [req.user.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
