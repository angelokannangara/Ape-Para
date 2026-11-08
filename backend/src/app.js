import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { uploadRoot } from './middleware/upload.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import departmentRoutes from './routes/departments.js';
import notificationRoutes from './routes/notifications.js';
import userRoutes from './routes/users.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind nginx / a PaaS proxy
  // Uploaded images are shown by the SPA, which may be on another origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));
  if (!config.isProd) app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/users', userRoutes);

  app.use('/uploads', express.static(uploadRoot, {
    index: false, dotfiles: 'deny', maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
