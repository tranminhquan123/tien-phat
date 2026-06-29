// src/controllers/contactController.ts
import type { Request, Response } from 'express';
import {
  appendContactSystemNote,
  createContact,
  getContacts,
  getContactStats,
  updateContactStatus,
} from '@/services/contactService';
import {
  sendContactNotification,
  sendTestNotificationEmail,
} from '@/services/emailService';
import {
  contactSubmissionSchema,
  type ContactSubmissionInput,
} from '@/validators/contactValidator';
import type { ContactMessageStatus } from '@/types';

const CONTACT_METHOD_LABELS: Record<NonNullable<ContactSubmissionInput['preferredContact']>, string> = {
  PHONE: 'Điện thoại',
  ZALO: 'Zalo',
  EMAIL: 'Email',
};

function formatArea(area?: string) {
  if (!area) return undefined;
  return /^\d+(?:[.,]\d+)?$/.test(area.trim()) ? `${area.trim()} m²` : area.trim();
}

function buildStoredMessage(input: ContactSubmissionInput) {
  const details = [
    input.inquiryType ? `Nhu cầu: ${input.inquiryType}` : '',
    input.tileSize ? `Kích thước: ${input.tileSize}` : '',
    input.area ? `Diện tích dự kiến: ${formatArea(input.area)}` : '',
    input.location ? `Khu vực / địa điểm: ${input.location}` : '',
    input.preferredContact ? `Muốn liên hệ qua: ${CONTACT_METHOD_LABELS[input.preferredContact]}` : '',
    input.preferredTime ? `Thời gian thuận tiện: ${input.preferredTime}` : '',
    '',
    `Nội dung: ${input.message}`,
    input.sourcePage ? `Nguồn gửi: ${input.sourcePage}` : '',
  ];

  return details.filter((line, index, lines) => {
    if (line) return true;
    return index > 0 && index < lines.length - 1 && Boolean(lines[index - 1]) && Boolean(lines[index + 1]);
  }).join('\n');
}

export async function submitContact(req: Request, res: Response) {
  const parsed = contactSubmissionSchema.safeParse(req.body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    res.status(400).json({
      success: false,
      message: firstIssue?.message || 'Thông tin liên hệ không hợp lệ',
    });
    return;
  }

  const input = parsed.data;

  // Trường ẩn dành cho bot. Trả kết quả thành công giả để bot không thử lại.
  if (input.website) {
    res.status(201).json({
      success: true,
      data: { id: 'received' },
      emailSent: false,
      message: 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.',
    });
    return;
  }

  try {
    const storedMessage = buildStoredMessage(input);
    const contact = await createContact({
      name: input.name,
      phone: input.phone,
      email: input.email,
      message: storedMessage,
    });

    const emailResult = await sendContactNotification({
      id: contact.id,
      name: input.name,
      phone: input.phone,
      email: input.email,
      message: input.message,
      inquiryType: input.inquiryType,
      tileSize: input.tileSize,
      area: formatArea(input.area),
      location: input.location,
      preferredContact: input.preferredContact,
      preferredTime: input.preferredTime,
      sourcePage: input.sourcePage,
      createdAt: contact.createdAt,
    });

    if (!emailResult.sent) {
      const reason = emailResult.error || 'Không xác định';
      const note = emailResult.skipped
        ? `[Hệ thống] Email thông báo chưa được gửi: ${reason}.`
        : `[Hệ thống] Gửi email thông báo thất bại: ${reason}.`;

      try {
        await appendContactSystemNote(contact.id, note.slice(0, 800));
      } catch (noteError) {
        console.error('Không thể lưu ghi chú lỗi email:', noteError);
      }
    }

    res.status(201).json({
      success: true,
      data: contact,
      emailSent: emailResult.sent,
      message: 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Không thể gửi liên hệ',
    });
  }
}

export async function adminSendTestEmail(req: Request, res: Response) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : undefined;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: 'Email nhận thông báo không hợp lệ' });
    return;
  }

  const result = await sendTestNotificationEmail(email);

  if (!result.sent) {
    res.status(400).json({
      success: false,
      message: result.error || 'Không thể gửi email kiểm tra',
    });
    return;
  }

  res.json({
    success: true,
    message: `Đã gửi email kiểm tra đến ${result.recipient}`,
  });
}

export async function adminListContacts(req: Request, res: Response) {
  try {
    const { status, page, limit } = req.query as Record<string, string>;
    const result = await getContacts({
      status: status as ContactMessageStatus | undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Không thể tải liên hệ',
    });
  }
}

export async function adminUpdateContact(req: Request, res: Response) {
  try {
    const { status, note } = req.body as { status: ContactMessageStatus; note?: string };
    const contact = await updateContactStatus(req.params['id'] as string, status, note);
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Không thể cập nhật liên hệ',
    });
  }
}

export async function adminGetContactStats(_req: Request, res: Response) {
  try {
    const stats = await getContactStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Không thể tải thống kê',
    });
  }
}
