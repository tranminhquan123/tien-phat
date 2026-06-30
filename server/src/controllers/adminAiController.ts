import type { Response } from 'express';
import type { AuthRequest } from '@/types';
import {
  AdminAiError,
  analyzeAdminChatSession,
  draftAdminReply,
} from '@/services/adminAiService';
import { getStoredAdminAiAnalysis } from '@/services/adminAiSnapshotService';
import {
  adminAiAnalyzeSchema,
  adminAiDraftSchema,
} from '@/validators/adminAiValidator';

function respondWithAiError(res: Response, error: unknown, fallback: string) {
  if (error instanceof AdminAiError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  console.error('[Admin AI]', error);
  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : fallback,
  });
}

export async function adminGetStoredAiAnalysis(req: AuthRequest, res: Response) {
  try {
    const data = await getStoredAdminAiAnalysis(req.params['id'] as string);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data });
  } catch (error) {
    respondWithAiError(res, error, 'Không thể tải kết quả phân tích');
  }
}

export async function adminAnalyzeChat(req: AuthRequest, res: Response) {
  const parsed = adminAiAnalyzeSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || 'Dữ liệu phân tích không hợp lệ',
    });
    return;
  }

  try {
    const data = await analyzeAdminChatSession(
      req.params['id'] as string,
      { force: parsed.data.force }
    );
    res.json({ success: true, data });
  } catch (error) {
    respondWithAiError(res, error, 'Không thể phân tích hội thoại');
  }
}

export async function adminDraftChatReply(req: AuthRequest, res: Response) {
  const parsed = adminAiDraftSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message || 'Dữ liệu soạn phản hồi không hợp lệ',
    });
    return;
  }

  try {
    const data = await draftAdminReply({
      sessionId: req.params['id'] as string,
      tone: parsed.data.tone,
      selectedProductIds: parsed.data.selectedProductIds,
    });
    res.json({ success: true, data });
  } catch (error) {
    respondWithAiError(res, error, 'Không thể soạn phản hồi');
  }
}
