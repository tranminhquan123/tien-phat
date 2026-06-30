import type { Request, RequestHandler } from 'express';

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 35;

const buckets = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim();

  return forwardedIp || req.ip || req.socket.remoteAddress || 'unknown';
}

function cleanup(now: number) {
  if (buckets.size < 300) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export const chatRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  cleanup(now);

  const key = getClientKey(req);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      success: false,
      message: 'Bạn gửi tin nhắn quá nhanh. Vui lòng đợi ít phút rồi thử lại.',
    });
    return;
  }

  current.count += 1;
  buckets.set(key, current);
  next();
};
