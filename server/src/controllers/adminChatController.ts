import type { Response } from 'express';
import type { ChatSessionStatus } from '@prisma/client';
import type { AuthRequest } from '@/types';
import {
  AdminChatError,
  getAdminChatSession,
  getAdminChatStats,
  listAdminChatSessions,
  sendAdminChatMessage,
  updateAdminChatStatus,
} from '@/services/adminChatService';
import {
  adminChatReplySchema,
  adminChatStatusSchema,
} from '@/validators/chatValidator';

function respondWithAdminChatError(res: Response, error: unknown, fallback: string) {
  if (error instanceof AdminChatError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  console.error('[Admin Chat]', error);
  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : fallback,
  });
}

function parsePositiveInteger(value: unknown, fallback: number, maximum: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export async function adminListChatSessions(req: AuthRequest, res: Response) {
  try {
    const status = typeof req.query['status'] === 'string'
      ? req.query['status'] as ChatSessionStatus
      : undefined;
    const search = typeof req.query['search'] === 'string'
      ? req.query['search']
      : undefined;

    const data = await listAdminChatSessions({
      status,
      search,
      page: parsePositiveInteger(req.query['page'], 1, 10_000),
      limit: parsePositiveInteger(req.query['limit'], 25, 100),
    });

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, ...data });
  } catch (error) {
    respondWithAdminChatError(res, error, 'Không thể tải danh sách hội thoại');
  }
}

export async function adminGetChatSession(req: AuthRequest, res: Response) {
  try {
    const data = await getAdminChatSession(req.params['id'] as string);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (error) {
    respondWithAdminChatError(res, error, 'Không thể tải cuộc trò chuyện');
  }
}

export async function adminPostChatMessage(req: AuthRequest, res: Response) {
  const parsed = adminChatReplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || 'Nội dung phản hồi không hợp lệ',
    });
    return;
  }

  if (!req.adminId) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await sendAdminChatMessage(
      req.params['id'] as string,
      req.adminId,
      parsed.data.message
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    respondWithAdminChatError(res, error, 'Không thể gửi phản hồi');
  }
}

export async function adminChangeChatStatus(req: AuthRequest, res: Response) {
  const parsed = adminChatStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || 'Trạng thái không hợp lệ',
    });
    return;
  }

  if (!req.adminId) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }

  try {
    const data = await updateAdminChatStatus(
      req.params['id'] as string,
      req.adminId,
      parsed.data.status
    );
    res.json({ success: true, data });
  } catch (error) {
    respondWithAdminChatError(res, error, 'Không thể cập nhật trạng thái hội thoại');
  }
}

export async function adminGetChatStats(_req: AuthRequest, res: Response) {
  try {
    const data = await getAdminChatStats();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (error) {
    respondWithAdminChatError(res, error, 'Không thể tải thống kê hội thoại');
  }
}
