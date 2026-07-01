import type { ContactMessageStatus, ContactPriority, ContactSource, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CrmListParams = {
  status?: ContactMessageStatus;
  priority?: ContactPriority;
  source?: ContactSource;
  assignedAdminId?: string;
  followUp?: 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'NONE';
  search?: string;
  page?: number;
  limit?: number;
};

export function vietnamDayBounds(date = new Date()) {
  const offset = 7 * 60 * 60 * 1000;
  const local = new Date(date.getTime() + offset);
  const startUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - offset;
  return { start: new Date(startUtc), end: new Date(startUtc + 86400000) };
}

function followUpWhere(filter?: CrmListParams['followUp']): Prisma.ContactMessageWhereInput {
  if (!filter) return {};
  const { start, end } = vietnamDayBounds();
  if (filter === 'TODAY') return { followUpAt: { gte: start, lt: end } };
  if (filter === 'OVERDUE') return { followUpAt: { lt: start }, status: { notIn: ['WON', 'LOST', 'CLOSED'] } };
  if (filter === 'UPCOMING') return { followUpAt: { gte: end } };
  return { followUpAt: null };
}

function positive(value: number | undefined, fallback: number, maximum: number) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback;
  return Math.min(Math.floor(value), maximum);
}

export async function listCrmContacts(params: CrmListParams) {
  const page = positive(params.page, 1, 100000);
  const limit = positive(params.limit, 30, 100);
  const search = params.search?.trim();
  const where: Prisma.ContactMessageWhereInput = {
    ...(params.status && { status: params.status }),
    ...(params.priority && { priority: params.priority }),
    ...(params.source && { source: params.source }),
    ...(params.assignedAdminId && { assignedAdminId: params.assignedAdminId }),
    ...followUpWhere(params.followUp),
    ...(search && { OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
      { note: { contains: search, mode: 'insensitive' } },
      { aiSummary: { contains: search, mode: 'insensitive' } },
    ] }),
  };

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      include: {
        assignedAdmin: { select: { id: true, name: true, username: true } },
        _count: { select: { activities: true } },
      },
      orderBy: [{ followUpAt: { sort: 'asc', nulls: 'last' } }, { updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  const ids = messages.map((item) => item.id);
  const chats = ids.length ? await prisma.chatSession.findMany({
    where: { handoffContactId: { in: ids } },
    select: { id: true, handoffContactId: true, status: true, lastMessageAt: true, leadScore: true, aiSummary: true },
  }) : [];
  const chatMap = new Map(chats.filter((chat) => chat.handoffContactId).map((chat) => [chat.handoffContactId as string, chat]));

  return {
    messages: messages.map((item) => ({
      ...item,
      source: item.source === 'CONTACT_FORM' && item.message.includes('Yêu cầu chuyển từ Trợ lý tư vấn') ? 'CHATBOT' : item.source,
      activityCount: item._count.activities,
      _count: undefined,
      linkedChat: chatMap.get(item.id) || null,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
