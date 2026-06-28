// src/middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  console.error('[Error]', err);

  if (err instanceof Error) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi server nội bộ',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Lỗi server nội bộ',
  });
}
