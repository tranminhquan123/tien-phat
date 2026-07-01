// src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'tien-phat-secret-key';
const JWT_EXPIRES_IN = '7d';

export async function loginAdmin(username: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!admin || !admin.isActive || admin.deletedAt) {
    throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');

  const lastLoginAt = new Date();
  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt } });
  const token = jwt.sign(
    {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      authVersion: admin.authVersion,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      isActive: admin.isActive,
      lastLoginAt,
    },
  };
}

export async function changePassword(adminId: string, oldPassword: string, newPassword: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin || !admin.isActive || admin.deletedAt) throw new Error('Tài khoản không tồn tại');

  const isValid = await bcrypt.compare(oldPassword, admin.password);
  if (!isValid) throw new Error('Mật khẩu cũ không đúng');
  if (newPassword.length < 8) throw new Error('Mật khẩu mới phải có ít nhất 8 ký tự');

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.admin.update({
    where: { id: adminId },
    data: {
      password: hashed,
      passwordChangedAt: new Date(),
      authVersion: { increment: 1 },
    },
  });
}
