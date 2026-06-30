import { api } from './api';
import type { ChatMessage, ChatSession } from '@/types';

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
