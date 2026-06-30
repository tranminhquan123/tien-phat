import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '@/types';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ACTIONS = 30;
const usage = new Map<string, { count: number; resetAt: number }>();

export function adminAiLimiter(req: AuthRequest, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = req.adminId || req.ip || 'anonymous';
  const current = usage.get(key);

  if (!current || current.resetAt <= now) {
    usage.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_ACTIONS) {
    res.status(429).json({
      success: false,
      message: 'Bạn đã thao tác quá nhanh. Vui lòng đợi ít phút rồi thử lại.',
    });
    return;
  }

  current.count += 1;
  usage.set(key, current);
  next();
}
