import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

const sendUnauthorized = (res) => res.status(401).json({ status: 401, message: 'Unauthorized' });

export function requireAuth(req, res, next) {
  const header = req.get('Authorization');

  if (typeof header !== 'string') {
    return sendUnauthorized(res);
  }

  const [scheme, token, ...rest] = header.trim().split(/\s+/);

  if (scheme !== 'Bearer' || !token || rest.length > 0) {
    return sendUnauthorized(res);
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return sendUnauthorized(res);
  }

  const userId = Number(payload?.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    return sendUnauthorized(res);
  }

  req.userId = userId;
  return next();
}
