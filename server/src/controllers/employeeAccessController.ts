import type { Response } from 'express';
import type { AuthRequest } from '@/types';
import { resetEmployeePassword } from '@/services/employeeMutationService';
import { EmployeeError } from '@/services/employeeQueryService';
import { resetEmployeePasswordSchema } from '@/validators/employeeValidator';

export async function adminResetEmployeeAccess(req: AuthRequest, res: Response) {
  const parsed = resetEmployeePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Thông tin mới không hợp lệ' });
    return;
  }

  try {
    await resetEmployeePassword(req.adminId!, req.params['id'] as string, parsed.data.newPassword);
    res.json({ success: true, message: 'Đã cập nhật thông tin đăng nhập và kết thúc các phiên cũ' });
  } catch (error) {
    if (error instanceof EmployeeError) {
      res.status(error.statusCode).json({ success: false, message: error.message, details: error.details });
      return;
    }
    console.error('[Employee access]', error);
    res.status(500).json({ success: false, message: 'Không thể cập nhật thông tin đăng nhập' });
  }
}
