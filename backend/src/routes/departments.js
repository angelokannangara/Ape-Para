import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { CATEGORIES, CATEGORY_TO_DEPARTMENT_TYPE, isInSriLanka, routeReport } from '../services/routing.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

// Public list (no polygons) — used by admin screens and the form.
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, type, contact_email FROM departments ORDER BY name');
    res.json({ departments: rows });
  } catch (err) { next(err); }
});

// Preview routing for the submission form: "this will be sent to ...".
const resolveSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  category: z.enum(CATEGORIES),
});

router.get('/resolve', async (req, res, next) => {
  try {
    const { lat, lng, category } = resolveSchema.parse(req.query);
    if (!isInSriLanka(lat, lng)) throw new HttpError(400, 'Location is outside Sri Lanka');
    const { department, method } = await routeReport({ query }, { category, lat, lng });
    res.json({ authorityType: CATEGORY_TO_DEPARTMENT_TYPE[category], department, method });
  } catch (err) { next(err); }
});

export default router;
