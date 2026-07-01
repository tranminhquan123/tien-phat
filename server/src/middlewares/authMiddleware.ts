import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import type { AdminRole, AuthRequest } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'tien-phat-secret-key';

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      adminId: string;
      username: string;
      authVersion?: number;
    };
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        deletedAt: true,
        authVersion: true,
      },
    });

    if (!admin || !admin.isActive || admin.deletedAt) {
      res.status(401).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
      return;
    }
    if (decoded.authVersion !== undefined && decoded.authVersion !== admin.authVersion) {
      res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hiệu lực' });
      return;
    }

    req.adminId = admin.id;
    req.adminUsername = admin.username;
    req.adminRole = admin.role;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
      return;
    }
    console.error('[Auth middleware]', error);
    res.status(500).json({ success: false, message: 'Không thể xác thực tài khoản' });
  }
}

export function requireRole(...roles: AdminRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.adminRole || !roles.includes(req.adminRole)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
      return;
    }
    next();
  };
}
