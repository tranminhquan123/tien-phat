import type { Response } from 'express';
import type { AuthRequest } from '@/types';
import {
  EmployeeError,
  getAssignableEmployees,
  getEmployeeDetail,
  getEmployeeStats,
  listEmployees,
} from '@/services/employeeQueryService';
import { employeeListQuerySchema } from '@/validators/employeeValidator';

function handleError(res: Response, error: unknown) {
  if (error instanceof EmployeeError) {
    res.status(error.statusCode).json({ success: false, message: error.message, details: error.details });
    return;
  }
  console.error('[Employee query]', error);
  res.status(500).json({ success: false, message: 'Không thể tải dữ liệu nhân viên' });
}

export async function adminListEmployees(req: AuthRequest, res: Response) {
  const parsed = employeeListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Bộ lọc không hợp lệ' });
    return;
  }
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, ...(await listEmployees(parsed.data)) });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminGetEmployee(req: AuthRequest, res: Response) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: await getEmployeeDetail(req.params['id'] as string) });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminGetEmployeeStats(_req: AuthRequest, res: Response) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: await getEmployeeStats() });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminGetAssignableEmployees(_req: AuthRequest, res: Response) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: await getAssignableEmployees() });
  } catch (error) {
    handleError(res, error);
  }
}
