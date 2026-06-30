import type { Request, Response } from 'express';
import {
  createChatSession,
  getChatSession,
  isChatAccessError,
  requestHumanHandoff,
  sendChatMessage,
} from '@/services/chatService';
import {
  createChatSessionSchema,
  handoffChatSchema,
  sendChatMessageSchema,
} from '@/validators/chatValidator';

function readSessionToken(req: Request) {
  const token = req.headers['x-chat-token'];
  return Array.isArray(token) ? token[0] || '' : token || '';
}

function respondWithError(res: Response, error: unknown, fallback: string) {
  if (isChatAccessError(error)) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  console.error('[Chat]', error);
  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : fallback,
  });
}

export async function createSession(req: Request, res: Response) {
  const parsed = createChatSessionSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' });
    return;
  }

  try {
    const data = await createChatSession(parsed.data.sourcePage);
    res.status(201).json({ success: true, data });
  } catch (error) {
    respondWithError(res, error, 'Không thể bắt đầu cuộc trò chuyện');
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const data = await getChatSession(req.params['id'] as string, readSessionToken(req));
    res.json({ success: true, data });
  } catch (error) {
    respondWithError(res, error, 'Không thể tải cuộc trò chuyện');
  }
}

export async function postMessage(req: Request, res: Response) {
  const parsed = sendChatMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Tin nhắn không hợp lệ' });
    return;
  }

  try {
    const data = await sendChatMessage(
      req.params['id'] as string,
      readSessionToken(req),
      parsed.data.message
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    respondWithError(res, error, 'Không thể gửi tin nhắn');
  }
}

export async function handoffSession(req: Request, res: Response) {
  const parsed = handoffChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || 'Thông tin liên hệ không hợp lệ' });
    return;
  }

  try {
    const data = await requestHumanHandoff(
      req.params['id'] as string,
      readSessionToken(req),
      parsed.data
    );
    res.json({ success: true, data });
  } catch (error) {
    respondWithError(res, error, 'Không thể chuyển yêu cầu đến nhân viên');
  }
}
