import type { RequestHandler } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

const requests = new Map<string, { count: number; resetAt: number }>();

export const contactRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = requests.get(key);

  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      success: false,
      message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
    });
    return;
  }

  current.count += 1;
  requests.set(key, current);
  next();
};
