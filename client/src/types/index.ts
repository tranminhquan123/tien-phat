// src/types/index.ts

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
  createdAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  unit?: string;
  brand?: string;
  origin?: string;
  size?: string;
  color?: string;
  productType?: string;
  surface?: string;
  glaze?: string;
  application?: string;
  pattern?: string;
  spaces?: string;
  collection?: string;
  faceCount?: number;
  piecesPerBox?: number;
  areaPerBox?: number;
  categoryId: string;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  images: ProductImage[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'NEW' | 'READING' | 'REPLIED' | 'CLOSED';
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ChatSessionStatus = 'AI_ACTIVE' | 'WAITING_ADMIN' | 'ADMIN_ACTIVE' | 'CLOSED';
export type ChatMessageSender = 'CUSTOMER' | 'ASSISTANT' | 'ADMIN' | 'SYSTEM';

export interface ChatProductRecommendation {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  unit: string | null;
  brand: string | null;
  size: string | null;
  category: {
    name: string;
    slug: string;
  };
  imageUrl?: string;
  reasons: string[];
  exactSize: boolean;
  score: number;
}

export interface ChatMessageMetadata {
  recommendations?: ChatProductRecommendation[];
  quickReplies?: string[];
  detected?: Record<string, unknown>;
  handoff?: boolean;
  contactId?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: ChatMessageSender;
  content: string;
  metadata?: ChatMessageMetadata | null;
  isRead: boolean;
  createdAt: string;
}

export interface ChatAdminSummary {
  id: string;
  name: string;
  username: string;
}

export interface ChatSession {
  id: string;
  status: ChatSessionStatus;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  detectedSize: string | null;
  detectedIntent: string | null;
  detectedCategory: string | null;
  detectedSpace: string | null;
  detectedBrand: string | null;
  detectedColor: string | null;
  sourcePage: string | null;
  handoffContactId?: string | null;
  assignedAdminId?: string | null;
  assignedAdmin?: ChatAdminSummary | null;
  acceptedAt?: string | null;
  closedAt?: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminChatSessionListItem extends ChatSession {
  unreadCount: number;
  lastMessage: Pick<ChatMessage, 'id' | 'sender' | 'content' | 'createdAt' | 'isRead'> | null;
  contact: Pick<ContactMessage, 'id' | 'name' | 'phone' | 'email' | 'status' | 'note' | 'createdAt' | 'updatedAt'> | null;
}

export interface AdminChatSessionDetail {
  session: ChatSession & { messages: ChatMessage[] };
  contact: ContactMessage | null;
}

export interface AdminChatStats {
  total: number;
  aiActive: number;
  waiting: number;
  active: number;
  closed: number;
  unreadMessages: number;
}

export interface SiteConfig {
  site_name: string;
  site_phone: string;
  site_email: string;
  contact_notification_email: string;
  site_address: string;
  site_zalo: string;
  site_facebook: string;
  site_working_hours: string;
  site_map_url: string;
  [key: string]: string;
}

export type AdminRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  products?: T[];
  messages?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
