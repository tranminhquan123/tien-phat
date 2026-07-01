import type { AdminUser, ChatMessage, ChatSessionStatus } from '@/types';

export type ContactStatus =
  | 'NEW' | 'READING' | 'RECEIVED' | 'CONSULTING'
  | 'WAITING_CUSTOMER' | 'QUOTED' | 'WON' | 'LOST'
  | 'REPLIED' | 'CLOSED';

export type ContactPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ContactSource = 'CONTACT_FORM' | 'CHATBOT' | 'MANUAL' | 'OTHER';
export type ContactActivityType =
  | 'CREATED' | 'STATUS_CHANGED' | 'NOTE_ADDED'
  | 'FOLLOW_UP_SET' | 'FOLLOW_UP_COMPLETED' | 'CONTACTED'
  | 'ASSIGNED' | 'PRIORITY_CHANGED' | 'SYSTEM';

export interface ContactActivity {
  id: string;
  contactId: string;
  type: ContactActivityType;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdByAdminId?: string | null;
  createdByAdmin?: AdminUser | null;
  createdAt: string;
}

export interface CrmContact {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  status: ContactStatus;
  priority: ContactPriority;
  source: ContactSource;
  note?: string | null;
  assignedAdminId?: string | null;
  assignedAdmin?: AdminUser | null;
  followUpAt?: string | null;
  lastContactAt?: string | null;
  aiSummary?: string | null;
  leadScore?: number | null;
  extractedRequirements?: Record<string, unknown> | null;
  activities?: ContactActivity[];
  activityCount?: number;
  linkedChat?: {
    id: string;
    status: ChatSessionStatus;
    lastMessageAt: string;
    leadScore?: number | null;
    aiSummary?: string | null;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CrmContactDetail {
  contact: CrmContact & { activities: ContactActivity[] };
  linkedChat: {
    id: string;
    status: ChatSessionStatus;
    lastMessageAt: string;
    aiSummary?: string | null;
    leadScore?: number | null;
    extractedRequirements?: Record<string, unknown> | null;
    messages: ChatMessage[];
  } | null;
}

export interface CrmStats {
  total: number;
  new: number;
  consulting: number;
  waitingCustomer: number;
  quoted: number;
  won: number;
  lost: number;
  highPriority: number;
  followUpToday: number;
  overdue: number;
}
