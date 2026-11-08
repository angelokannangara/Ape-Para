import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') throw new Error(`Missing required env var ${name}`);
  return v;
}

const jwtSecret = required('JWT_SECRET', isProd ? undefined : 'dev-only-insecure-secret-change-me-please');
if (isProd && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

export const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL', 'postgres://apepara:apepara@localhost:5432/apepara'),
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024,
  routingFallbackKm: Number(process.env.ROUTING_FALLBACK_KM || 50),
};
