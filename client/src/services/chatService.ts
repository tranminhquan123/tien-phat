import { api } from './api';
import type {
  AdminChatSessionDetail,
  AdminChatSessionListItem,
  AdminChatStats,
  ChatMessage,
  ChatSession,
  ChatSessionStatus,
} from '@/types';

export type ChatCredentials = {
  sessionId: string;
  accessToken: string;
};

export type HandoffPayload = {
  name: string;
  phone: string;
  email?: string;
  note?: string;
};

const STORAGE_KEY = 'tien-phat-advisory-chat-v1';

function tokenHeaders(accessToken: string) {
  return { 'X-Chat-Token': accessToken };
}

export function saveChatCredentials(credentials: ChatCredentials) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export function loadChatCredentials(): ChatCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChatCredentials>;
    if (!parsed.sessionId || !parsed.accessToken) return null;
    return { sessionId: parsed.sessionId, accessToken: parsed.accessToken };
  } catch {
    return null;
  }
}

export function clearChatCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}

export function createChatSession(sourcePage?: string) {
  return api.post<{
    success: boolean;
    data: {
      session: ChatSession;
      accessToken: string;
      messages: ChatMessage[];
    };
  }>('/chat/sessions', { sourcePage });
}

export function getChatSession(credentials: ChatCredentials) {
  return api.get<{
    success: boolean;
    data: {
      session: ChatSession;
      messages: ChatMessage[];
    };
  }>(`/chat/sessions/${credentials.sessionId}`, {
    headers: tokenHeaders(credentials.accessToken),
  });
}

export function sendChatMessage(credentials: ChatCredentials, message: string) {
  return api.post<{
    success: boolean;
    data: {
      session: ChatSession;
      customerMessage: ChatMessage;
      assistantMessage: ChatMessage | null;
    };
  }>(
    `/chat/sessions/${credentials.sessionId}/messages`,
    { message },
    { headers: tokenHeaders(credentials.accessToken), timeoutMs: 25_000 }
  );
}

export function requestHumanHandoff(
  credentials: ChatCredentials,
  payload: HandoffPayload
) {
  return api.post<{
    success: boolean;
    data: {
      session: ChatSession;
      assistantMessage?: ChatMessage;
      emailSent: boolean;
      alreadyRequested: boolean;
    };
  }>(
    `/chat/sessions/${credentials.sessionId}/handoff`,
    payload,
    { headers: tokenHeaders(credentials.accessToken), timeoutMs: 25_000 }
  );
}

export function adminGetChatSessions(params: {
  status?: ChatSessionStatus;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return api.get<{
    success: boolean;
    sessions: AdminChatSessionListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/chat/admin/sessions${qs ? `?${qs}` : ''}`);
}

export function adminGetChatSession(sessionId: string) {
  return api.get<{ success: boolean; data: AdminChatSessionDetail }>(
    `/chat/admin/sessions/${sessionId}`
  );
}

export function adminSendChatMessage(sessionId: string, message: string) {
  return api.post<{
    success: boolean;
    data: {
      session: ChatSession;
      message: ChatMessage;
    };
  }>(`/chat/admin/sessions/${sessionId}/messages`, { message });
}

export function adminUpdateChatStatus(sessionId: string, status: ChatSessionStatus) {
  return api.put<{ success: boolean; data: AdminChatSessionDetail }>(
    `/chat/admin/sessions/${sessionId}/status`,
    { status }
  );
}

export function adminGetChatStats() {
  return api.get<{ success: boolean; data: AdminChatStats }>('/chat/admin/stats');
}
