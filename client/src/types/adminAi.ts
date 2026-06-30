import type { ChatProductRecommendation } from '@/types';

export type AdminAiContactChannel = 'ZALO' | 'PHONE' | 'EMAIL' | 'UNKNOWN';
export type AdminAiLeadLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AdminAiProvider = 'openai' | 'rules';

export interface AdminAiRequirements {
  size: string | null;
  intent: string | null;
  application: string | null;
  space: string | null;
  brand: string | null;
  color: string | null;
  areaM2: number | null;
  budget: string | null;
  location: string | null;
  purchaseTimeline: string | null;
  contactChannel: AdminAiContactChannel;
  wantsQuote: boolean;
  notes: string[];
}

export interface AdminAiAnalysis {
  summary: string;
  requirements: AdminAiRequirements;
  leadScore: number;
  leadLevel: AdminAiLeadLevel;
  suggestedProducts: ChatProductRecommendation[];
  provider: AdminAiProvider;
  model: string | null;
  analyzedAt: string;
  cached: boolean;
  stale?: boolean;
  aiConfigured: boolean;
  warning?: string;
}

export interface AdminAiSnapshotResponse {
  success: boolean;
  data: {
    analysis: AdminAiAnalysis | null;
    aiConfigured: boolean;
  };
}

export interface AdminAiAnalyzeResponse {
  success: boolean;
  data: AdminAiAnalysis;
}

export interface AdminAiDraftResponse {
  success: boolean;
  data: {
    draft: string;
    provider: AdminAiProvider;
    model: string | null;
    aiConfigured: boolean;
    selectedProducts: ChatProductRecommendation[];
    warning?: string;
  };
}
