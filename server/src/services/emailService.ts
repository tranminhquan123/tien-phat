import nodemailer from 'nodemailer';
import { getAllConfigs } from '@/services/configService';

export type ContactNotificationPayload = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  inquiryType?: string;
  tileSize?: string;
  area?: string;
  location?: string;
  preferredContact?: 'PHONE' | 'ZALO' | 'EMAIL';
  preferredTime?: string;
  sourcePage?: string;
  createdAt: Date;
};

type EmailResult = {
  sent: boolean;
  skipped: boolean;
  recipient?: string;
  error?: string;
};

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
};

type ResendErrorResponse = {
  message?: string;
  name?: string;
};

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim().replace(/\s+/g, '');
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass || !Number.isInteger(port) || port <= 0) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return transporter;
}

function hasResendConfiguration() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getResendFromAddress() {
  return process.env.RESEND_FROM?.trim()
    || 'Tiến Phát Website <onboarding@resend.dev>';
}

function getSmtpFromAddress() {
  return process.env.EMAIL_FROM?.trim()
    || `Tiến Phát Website <${process.env.SMTP_USER}>`;
}

async function resolveRecipient(preferredRecipient?: string) {
  if (preferredRecipient?.trim()) return preferredRecipient.trim();

  let config: Record<string, string> = {};
  try {
    config = await getAllConfigs();
  } catch (error) {
    console.error('Không thể đọc cấu hình email nhận thông báo:', error);
  }

  return (
    config['contact_notification_email']?.trim()
    || process.env.EMAIL_TO?.trim()
    || config['site_email']?.trim()
    || process.env.SMTP_USER?.trim()
    || ''
  );
}

async function sendWithResend(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      sent: false,
      skipped: true,
      recipient: message.to,
      error: 'RESEND_API_KEY chưa được cấu hình',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(message.idempotencyKey
          ? { 'Idempotency-Key': message.idempotencyKey }
          : {}),
      },
      body: JSON.stringify({
        from: getResendFromAddress(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorBody: ResendErrorResponse = {};

      try {
        errorBody = await response.json() as ResendErrorResponse;
      } catch {
        // Giữ thông báo mặc định khi phía cung cấp không trả JSON.
      }

      const providerMessage = errorBody.message
        || `Resend trả về HTTP ${response.status}`;

      return {
        sent: false,
        skipped: false,
        recipient: message.to,
        error: providerMessage,
      };
    }

    return {
      sent: true,
      skipped: false,
      recipient: message.to,
    };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Không xác định';

    return {
      sent: false,
      skipped: false,
      recipient: message.to,
      error: errorMessage === 'This operation was aborted'
        ? 'Kết nối đến Resend API bị quá thời gian'
        : errorMessage,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendWithSmtp(message: EmailMessage): Promise<EmailResult> {
  const mailer = getTransporter();

  if (!mailer) {
    return {
      sent: false,
      skipped: true,
      recipient: message.to,
      error: 'SMTP chưa được cấu hình đầy đủ',
    };
  }

  try {
    await mailer.sendMail({
      from: getSmtpFromAddress(),
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    return {
      sent: true,
      skipped: false,
      recipient: message.to,
    };
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Không xác định';

    console.error('Gửi email qua SMTP thất bại:', errorMessage);

    return {
      sent: false,
      skipped: false,
      recipient: message.to,
      error: errorMessage,
    };
  }
}

async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  // Render Free chặn các cổng SMTP phổ biến. API HTTPS được ưu tiên khi có khóa Resend.
  if (hasResendConfiguration()) {
    return sendWithResend(message);
  }

  return sendWithSmtp(message);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function preferredContactLabel(value?: ContactNotificationPayload['preferredContact']) {
  if (value === 'ZALO') return 'Zalo';
  if (value === 'EMAIL') return 'Email';
  if (value === 'PHONE') return 'Điện thoại';
  return '';
}

function row(label: string, value?: string) {
  if (!value) return '';

  return `
    <tr>
      <td style="padding:8px 12px;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;width:180px;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;color:#0f172a;font-size:14px;font-weight:600;border-bottom:1px solid #e2e8f0;">${escapeHtml(value)}</td>
    </tr>`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}

function buildContactEmail(payload: ContactNotificationPayload) {
  const adminUrl = `${(process.env.CLIENT_URL || '').replace(/\/$/, '')}/admin/lien-he`;
  const contactMethod = preferredContactLabel(payload.preferredContact);
  const safeMessage = escapeHtml(payload.message).replace(/\n/g, '<br>');
  const reference = payload.id.slice(0, 8).toUpperCase();

  const html = `
  <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="padding:22px 26px;background:#ea580c;color:#ffffff;">
        <div style="font-size:12px;opacity:.9;text-transform:uppercase;letter-spacing:.08em;">Tiến Phát</div>
        <h1 style="margin:6px 0 0;font-size:22px;">Có yêu cầu tư vấn mới</h1>
      </div>

      <div style="padding:24px 26px;">
        <p style="margin:0 0 16px;color:#475569;font-size:14px;">Mã yêu cầu: <strong style="color:#0f172a;">${reference}</strong></p>

        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          ${row('Khách hàng', payload.name)}
          ${row('Số điện thoại', payload.phone)}
          ${row('Email', payload.email)}
          ${row('Nhu cầu', payload.inquiryType)}
          ${row('Kích thước', payload.tileSize)}
          ${row('Diện tích dự kiến', payload.area)}
          ${row('Khu vực / địa điểm', payload.location)}
          ${row('Muốn liên hệ qua', contactMethod)}
          ${row('Thời gian thuận tiện', payload.preferredTime)}
          ${row('Thời gian gửi', formatDate(payload.createdAt))}
        </table>

        <div style="margin-top:18px;padding:16px;background:#f8fafc;border-radius:12px;line-height:1.65;font-size:14px;">
          <div style="margin-bottom:6px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">Nội dung khách hàng</div>
          ${safeMessage}
        </div>

        ${payload.sourcePage ? `<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;word-break:break-all;">Nguồn: ${escapeHtml(payload.sourcePage)}</p>` : ''}

        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;">
          <a href="tel:${escapeHtml(payload.phone.replace(/\s+/g, ''))}" style="display:inline-block;padding:11px 16px;background:#ea580c;color:#ffffff;text-decoration:none;border-radius:9px;font-weight:700;font-size:14px;">Gọi khách hàng</a>
          ${payload.email ? `<a href="mailto:${escapeHtml(payload.email)}" style="display:inline-block;padding:11px 16px;border:1px solid #ea580c;color:#ea580c;text-decoration:none;border-radius:9px;font-weight:700;font-size:14px;">Gửi email</a>` : ''}
          ${process.env.CLIENT_URL ? `<a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:11px 16px;border:1px solid #cbd5e1;color:#334155;text-decoration:none;border-radius:9px;font-weight:700;font-size:14px;">Mở trang quản trị</a>` : ''}
        </div>
      </div>
    </div>
  </div>`;

  const text = [
    'TIẾN PHÁT - YÊU CẦU TƯ VẤN MỚI',
    `Mã yêu cầu: ${reference}`,
    `Khách hàng: ${payload.name}`,
    `Số điện thoại: ${payload.phone}`,
    payload.email ? `Email: ${payload.email}` : '',
    payload.inquiryType ? `Nhu cầu: ${payload.inquiryType}` : '',
    payload.tileSize ? `Kích thước: ${payload.tileSize}` : '',
    payload.area ? `Diện tích: ${payload.area}` : '',
    payload.location ? `Khu vực / địa điểm: ${payload.location}` : '',
    contactMethod ? `Muốn liên hệ qua: ${contactMethod}` : '',
    payload.preferredTime ? `Thời gian thuận tiện: ${payload.preferredTime}` : '',
    '',
    payload.message,
    payload.sourcePage ? `\nNguồn: ${payload.sourcePage}` : '',
  ].filter(Boolean).join('\n');

  return { html, text, reference };
}

export async function sendContactNotification(payload: ContactNotificationPayload): Promise<EmailResult> {
  const recipient = await resolveRecipient();

  if (!recipient) {
    return {
      sent: false,
      skipped: true,
      error: 'Chưa có email nhận thông báo. Hãy nhập tại Admin > Cài đặt.',
    };
  }

  const { html, text, reference } = buildContactEmail(payload);

  return sendEmail({
    to: recipient,
    replyTo: payload.email,
    subject: `[Tiến Phát] Liên hệ mới ${reference} - ${payload.name}`,
    html,
    text,
    idempotencyKey: `contact-${payload.id}`,
  });
}

export async function sendTestNotificationEmail(preferredRecipient?: string): Promise<EmailResult> {
  const recipient = await resolveRecipient(preferredRecipient);

  if (!recipient) {
    return {
      sent: false,
      skipped: true,
      error: 'Chưa có email nhận thông báo. Hãy nhập tại Admin > Cài đặt.',
    };
  }

  return sendEmail({
    to: recipient,
    subject: '[Tiến Phát] Kiểm tra email thông báo',
    text: 'Email thông báo từ website Tiến Phát đã được cấu hình thành công.',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <div style="background:#ea580c;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0;">
          <h2 style="margin:0;">Kiểm tra email thành công</h2>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:0;padding:22px;border-radius:0 0 12px 12px;">
          <p style="margin:0;color:#334155;line-height:1.6;">Website Tiến Phát có thể gửi thông báo liên hệ mới đến địa chỉ email này.</p>
        </div>
      </div>`,
  });
}
