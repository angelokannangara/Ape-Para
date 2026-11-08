import { ZodError } from 'zod';
import multer from 'multer';
import { config } from '../config.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? `Image must be under ${Math.round(config.maxUploadBytes / 1024 / 1024)} MB`
      : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err.status) return res.status(err.status).json({ error: err.message, details: err.details });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
