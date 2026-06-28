// src/controllers/authController.ts
import type { Request, Response } from 'express';
import { loginAdmin, changePassword } from '@/services/authService';
import type { AuthRequest } from '@/types';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Cần nhập username và password' });
  }
  try {
    const result = await loginAdmin(username, password);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(401).json({ success: false, message: (err as Error).message });
  }
}

export async function updatePassword(req: AuthRequest, res: Response) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Cần nhập đủ mật khẩu cũ và mới' });
  }
  try {
    await changePassword(req.adminId!, oldPassword, newPassword);
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}
