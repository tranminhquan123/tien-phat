import type { Response } from 'express';
import type { AuthRequest } from '@/types';
import { getCrmContactDetail, getCrmOptions, getCrmStats } from '@/services/crmDetailService';
import { listCrmContacts } from '@/services/crmListService';
import { updateCrmContact } from '@/services/crmUpdateService';
import { contactListQuerySchema, contactUpdateSchema } from '@/validators/crmValidator';

function fail(res: Response, error: unknown, fallback: string, status = 400) {
  const message = error instanceof Error ? error.message : fallback;
  res.status(message.includes('Không tìm thấy') ? 404 : status).json({ success: false, message });
}

export async function crmListContacts(req: AuthRequest, res: Response) {
  const parsed = contactListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Bộ lọc không hợp lệ' });
    return;
  }
  try {
    const result = await listCrmContacts(parsed.data);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, ...result });
  } catch (error) {
    fail(res, error, 'Không thể tải khách hàng', 500);
  }
}

export async function crmGetContact(req: AuthRequest, res: Response) {
  try {
    const data = await getCrmContactDetail(req.params['id'] as string);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (error) {
    fail(res, error, 'Không thể tải chi tiết khách hàng');
  }
}

export async function crmUpdateContact(req: AuthRequest, res: Response) {
  const parsed = contactUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Dữ liệu cập nhật không hợp lệ' });
    return;
  }
  try {
    const data = await updateCrmContact(req.params['id'] as string, parsed.data, req.adminId);
    res.json({ success: true, data });
  } catch (error) {
    fail(res, error, 'Không thể cập nhật khách hàng');
  }
}

export async function crmGetStats(_req: AuthRequest, res: Response) {
  try {
    const data = await getCrmStats();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (error) {
    fail(res, error, 'Không thể tải thống kê', 500);
  }
}

export async function crmGetOptions(_req: AuthRequest, res: Response) {
  try {
    const data = await getCrmOptions();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (error) {
    fail(res, error, 'Không thể tải tùy chọn CRM', 500);
  }
}
