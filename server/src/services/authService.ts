// src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'tien-phat-secret-key';
const JWT_EXPIRES_IN = '7d';

export async function loginAdmin(username: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { username } });

  if (!admin) {
    throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
  }

  const token = jwt.sign(
    { adminId: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
    },
  };
}

export async function changePassword(adminId: string, oldPassword: string, newPassword: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error('Admin không tồn tại');

  const isValid = await bcrypt.compare(oldPassword, admin.password);
  if (!isValid) throw new Error('Mật khẩu cũ không đúng');

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.admin.update({
    where: { id: adminId },
    data: { password: hashed },
  });
}
