// src/controllers/contactController.ts
import type { Request, Response } from 'express';
import { createContact, getContacts, updateContactStatus, getContactStats } from '@/services/contactService';
import type { ContactMessageStatus } from '@/types';

export async function submitContact(req: Request, res: Response) {
  const { name, phone, email, message } = req.body as {
    name: string; phone: string; email?: string; message: string;
  };
  if (!name || !phone || !message) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên, số điện thoại và nội dung' });
  }
  try {
    const contact = await createContact({ name, phone, email, message });
    res.status(201).json({ success: true, data: contact, message: 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.' });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function adminListContacts(req: Request, res: Response) {
  try {
    const { status, page, limit } = req.query as Record<string, string>;
    const result = await getContacts({
      status: status as ContactMessageStatus | undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}

export async function adminUpdateContact(req: Request, res: Response) {
  try {
    const { status, note } = req.body as { status: ContactMessageStatus; note?: string };
    const contact = await updateContactStatus(req.params['id'] as string, status, note);
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
}

export async function adminGetContactStats(req: Request, res: Response) {
  try {
    const stats = await getContactStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
}
