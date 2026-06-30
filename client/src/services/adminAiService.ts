import { api } from './api';
import type {
  AdminAiAnalyzeResponse,
  AdminAiDraftResponse,
  AdminAiSnapshotResponse,
} from '@/types/adminAi';

export function getStoredChatAnalysis(sessionId: string) {
  return api.get<AdminAiSnapshotResponse>(
    `/chat/admin/sessions/${sessionId}/analysis`,
    { timeoutMs: 25_000 }
  );
}

export function analyzeChat(sessionId: string, force = false) {
  return api.post<AdminAiAnalyzeResponse>(
    `/chat/admin/sessions/${sessionId}/analysis`,
    { force },
    { timeoutMs: 45_000 }
  );
}

export function draftChatReply(
  sessionId: string,
  payload: {
    tone?: 'FRIENDLY' | 'CONCISE' | 'PROFESSIONAL';
    selectedProductIds?: string[];
  } = {}
) {
  return api.post<AdminAiDraftResponse>(
    `/chat/admin/sessions/${sessionId}/draft`,
    payload,
    { timeoutMs: 45_000 }
  );
}
