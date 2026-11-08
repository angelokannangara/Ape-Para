import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, dept: user.department_id ?? null },
    config.jwtSecret,
    { algorithm: 'HS256', expiresIn: config.jwtExpiresIn },
  );
}

/** Verifies the Bearer token and attaches req.user = { id, role, departmentId }. */
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Authentication required'));
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, role: payload.role, departmentId: payload.dept };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

/** Role-Based Access Control: requireRole('admin', 'field_worker') */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission to do this'));
  next();
};
