import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadImage, hasImageSignature, removeFile } from '../middleware/upload.js';
import { CATEGORIES, isInSriLanka, routeReport } from '../services/routing.js';
import { notify } from '../services/notifications.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();
router.use(authenticate);

const STATUSES = ['submitted', 'in_review', 'in_progress', 'resolved'];
const STATUS_LABEL = {
  submitted: 'Submitted', in_review: 'In review', in_progress: 'In progress', resolved: 'Resolved',
};

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(2000),
  category: z.enum(CATEGORIES),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const SELECT_REPORT = `
  SELECT r.id, r.user_id, r.title, r.description, r.category, r.status, r.image_url,
         r.routing_method, r.created_at, r.updated_at,
         ST_Y(r.location::geometry) AS lat, ST_X(r.location::geometry) AS lng,
         r.assigned_department_id, d.name AS department_name, d.type AS department_type
  FROM reports r
  LEFT JOIN departments d ON d.id = r.assigned_department_id`;

const toApi = (r) => ({
  id: r.id, userId: r.user_id, title: r.title, description: r.description,
  category: r.category, status: r.status, imageUrl: r.image_url,
  lat: r.lat, lng: r.lng, routingMethod: r.routing_method,
  department: r.assigned_department_id
    ? { id: r.assigned_department_id, name: r.department_name, type: r.department_type }
    : null,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

/** Citizens see their own reports; field workers their department's; admins everything. */
function scopeFor(user, params) {
  if (user.role === 'admin') return { clause: 'TRUE' };
  if (user.role === 'field_worker') {
    params.push(user.departmentId);
    return { clause: `r.assigned_department_id = $${params.length}` };
  }
  params.push(user.id);
  return { clause: `r.user_id = $${params.length}` };
}

async function loadReport(id, user) {
  const params = [id];
  const scope = scopeFor(user, params);
  const { rows } = await query(`${SELECT_REPORT} WHERE r.id = $1 AND ${scope.clause}`, params);
  if (!rows[0]) throw new HttpError(404, 'Report not found');
  return rows[0];
}

// ---------------------------------------------------------------- POST /api/reports
router.post('/', requireRole('citizen', 'admin'), (req, res, next) => {
  uploadImage(req, res, async (uploadErr) => {
    const file = req.file;
    try {
      if (uploadErr) throw uploadErr;
      const data = createSchema.parse(req.body);
      if (!isInSriLanka(data.lat, data.lng)) throw new HttpError(400, 'The pinned location is outside Sri Lanka');
      if (file && !(await hasImageSignature(file.path))) {
        throw new HttpError(400, 'Uploaded file is not a valid image');
      }

      const report = await withTransaction(async (client) => {
        // Automated routing: category rule + PostGIS spatial match.
        const { department, method } = await routeReport(client, data);

        const { rows } = await client.query(
          `INSERT INTO reports
             (user_id, title, description, category, location,
              assigned_department_id, routing_method, image_url)
           VALUES ($1, $2, $3, $4,
                   ST_SetSRID(ST_MakePoint($5::float8, $6::float8), 4326)::geography,
                   $7, $8, $9)
           RETURNING id`,
          [req.user.id, data.title, data.description, data.category, data.lng, data.lat,
            department?.id ?? null, method, file ? `/uploads/${file.filename}` : null],
        );

        await notify(client, req.user.id, rows[0].id,
          department
            ? `Your report "${data.title}" was received and sent to ${department.name}.`
            : `Your report "${data.title}" was received and is awaiting manual assignment.`);

        const full = await client.query(`${SELECT_REPORT} WHERE r.id = $1`, [rows[0].id]);
        return full.rows[0];
      });

      res.status(201).json({ report: toApi(report) });
    } catch (err) {
      if (file) await removeFile(file.path); // don't leave orphan uploads on failure
      next(err);
    }
  });
});

// ----------------------------------------------------------------- GET /api/reports
const listSchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get('/', async (req, res, next) => {
  try {
    const { status, category, limit, offset } = listSchema.parse(req.query);
    const params = [];
    const where = [scopeFor(req.user, params).clause];
    if (status) { params.push(status); where.push(`r.status = $${params.length}`); }
    if (category) { params.push(category); where.push(`r.category = $${params.length}`); }
    params.push(limit, offset);
    const { rows } = await query(
      `${SELECT_REPORT} WHERE ${where.join(' AND ')}
       ORDER BY r.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    res.json({ reports: rows.map(toApi) });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    z.string().uuid().parse(req.params.id);
    res.json({ report: toApi(await loadReport(req.params.id, req.user)) });
  } catch (err) { next(err); }
});

// ------------------------------------------------- PATCH /api/reports/:id/status
router.patch('/:id/status', requireRole('field_worker', 'admin'), async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
    const existing = await loadReport(id, req.user); // enforces department scope for field workers

    if (existing.status !== status) {
      await withTransaction(async (client) => {
        await client.query('UPDATE reports SET status = $1 WHERE id = $2', [status, id]);
        await notify(client, existing.user_id, id,
          `Your report "${existing.title}" is now: ${STATUS_LABEL[status]}.`);
      });
    }
    res.json({ report: toApi(await loadReport(id, req.user)) });
  } catch (err) { next(err); }
});

// ---------------------------------------- PATCH /api/reports/:id/department (admin)
router.patch('/:id/department', requireRole('admin'), async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { departmentId } = z.object({ departmentId: z.string().uuid() }).parse(req.body);
    const dept = await query('SELECT id, name FROM departments WHERE id = $1', [departmentId]);
    if (!dept.rows[0]) throw new HttpError(404, 'Department not found');
    const existing = await loadReport(id, req.user);

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE reports SET assigned_department_id = $1, routing_method = 'manual' WHERE id = $2`,
        [departmentId, id],
      );
      await notify(client, existing.user_id, id,
        `Your report "${existing.title}" was reassigned to ${dept.rows[0].name}.`);
    });
    res.json({ report: toApi(await loadReport(id, req.user)) });
  } catch (err) { next(err); }
});

export default router;
