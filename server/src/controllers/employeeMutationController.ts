import type { Response } from 'express';
import type { AuthRequest } from '@/types';
import {
  createEmployee,
  disableEmployee,
  updateEmployee,
} from '@/services/employeeMutationService';
import { reassignEmployeeWork } from '@/services/employeeReassignmentService';
import { EmployeeError } from '@/services/employeeQueryService';
import {
  createEmployeeSchema,
  disableEmployeeSchema,
  updateEmployeeSchema,
} from '@/validators/employeeValidator';

function handleError(res: Response, error: unknown) {
  if (error instanceof EmployeeError) {
    res.status(error.statusCode).json({ success: false, message: error.message, details: error.details });
    return;
  }
  console.error('[Employee mutation]', error);
  res.status(500).json({ success: false, message: 'Không thể cập nhật nhân viên' });
}

export async function adminCreateEmployee(req: AuthRequest, res: Response) {
  const parsed = createEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' });
    return;
  }
  try {
    const data = await createEmployee(req.adminId!, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminUpdateEmployee(req: AuthRequest, res: Response) {
  const parsed = updateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' });
    return;
  }
  try {
    const data = await updateEmployee(req.adminId!, req.params['id'] as string, parsed.data);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminChangeEmployeeStatus(req: AuthRequest, res: Response) {
  const isActive = req.body?.isActive;
  if (typeof isActive !== 'boolean') {
    res.status(400).json({ success: false, message: 'Trạng thái nhân viên không hợp lệ' });
    return;
  }

  try {
    if (isActive) {
      const data = await updateEmployee(req.adminId!, req.params['id'] as string, { isActive: true });
      res.json({ success: true, data });
      return;
    }

    const parsed = disableEmployeeSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Dữ liệu bàn giao không hợp lệ' });
      return;
    }
    const data = await disableEmployee(req.adminId!, req.params['id'] as string, parsed.data.reassignToAdminId);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminDisableEmployee(req: AuthRequest, res: Response) {
  const parsed = disableEmployeeSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Dữ liệu bàn giao không hợp lệ' });
    return;
  }
  try {
    const data = await disableEmployee(req.adminId!, req.params['id'] as string, parsed.data.reassignToAdminId);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function adminReassignEmployee(req: AuthRequest, res: Response) {
  const parsed = disableEmployeeSchema.safeParse(req.body || {});
  if (!parsed.success || !parsed.data.reassignToAdminId) {
    res.status(400).json({ success: false, message: 'Cần chọn nhân viên nhận bàn giao' });
    return;
  }
  try {
    const data = await reassignEmployeeWork(req.adminId!, req.params['id'] as string, parsed.data.reassignToAdminId);
    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error);
  }
}
