import type { ChatSessionStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class AdminChatError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AdminChatError';
    this.statusCode = statusCode;
  }
}

type ListAdminChatParams = {
  status?: ChatSessionStatus;
  search?: string;
  page?: number;
  limit?: number;
};

const SESSION_SELECT = {
  id: true,
  status: true,
  customerName: true,
  phone: true,
  email: true,
  detectedSize: true,
  detectedIntent: true,
  detectedCategory: true,
  detectedSpace: true,
  detectedBrand: true,
  detectedColor: true,
  sourcePage: true,
  handoffContactId: true,
  assignedAdminId: true,
  assignedAdmin: {
    select: { id: true, name: true, username: true },
  },
  acceptedAt: true,
  closedAt: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChatSessionSelect;

function clampInteger(value: number | undefined, fallback: number, maximum: number) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback;
  return Math.min(Math.floor(value), maximum);
}

async function getContactMap(contactIds: string[]) {
  if (contactIds.length === 0) return new Map();

  const contacts = await prisma.contactMessage.findMany({
    where: { id: { in: contactIds } },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      status: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return new Map(contacts.map((contact) => [contact.id, contact]));
}

export async function listAdminChatSessions(params: ListAdminChatParams) {
  const page = clampInteger(params.page, 1, 10_000);
  const limit = clampInteger(params.limit, 25, 100);
  const search = params.search?.trim();
  const where: Prisma.ChatSessionWhereInput = {
    ...(params.status && { status: params.status }),
    ...(search && {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { detectedSize: { contains: search, mode: 'insensitive' } },
        { detectedBrand: { contains: search, mode: 'insensitive' } },
        { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
      ],
    }),
  };

  const [sessions, total] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      select: {
        ...SESSION_SELECT,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            sender: true,
            content: true,
            createdAt: true,
            isRead: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: { sender: 'CUSTOMER', isRead: false },
            },
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.chatSession.count({ where }),
  ]);

  const contactMap = await getContactMap(
    sessions
      .map((session) => session.handoffContactId)
      .filter((id): id is string => Boolean(id))
  );

  return {
    sessions: sessions.map((session) => ({
      ...session,
      lastMessage: session.messages[0] ?? null,
      messages: undefined,
      unreadCount: session._count.messages,
      _count: undefined,
      contact: session.handoffContactId
        ? contactMap.get(session.handoffContactId) ?? null
        : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getAdminChatSession(sessionId: string) {
  const exists = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { id: true, handoffContactId: true },
  });

  if (!exists) throw new AdminChatError('Không tìm thấy cuộc trò chuyện', 404);

  await prisma.$transaction([
    prisma.chatMessage.updateMany({
      where: { sessionId, sender: 'CUSTOMER', isRead: false },
      data: { isRead: true },
    }),
    ...(exists.handoffContactId
      ? [prisma.contactMessage.updateMany({
          where: { id: exists.handoffContactId, status: 'NEW' },
          data: { status: 'READING' },
        })]
      : []),
  ]);

  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      ...SESSION_SELECT,
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 160,
        select: {
          id: true,
          sessionId: true,
          sender: true,
          content: true,
          metadata: true,
          isRead: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) throw new AdminChatError('Không tìm thấy cuộc trò chuyện', 404);

  const contact = session.handoffContactId
    ? await prisma.contactMessage.findUnique({ where: { id: session.handoffContactId } })
    : null;

  return { session, contact };
}

export async function sendAdminChatMessage(
  sessionId: string,
  adminId: string,
  content: string
) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      assignedAdminId: true,
      acceptedAt: true,
      handoffContactId: true,
    },
  });

  if (!session) throw new AdminChatError('Không tìm thấy cuộc trò chuyện', 404);
  if (session.status === 'CLOSED') {
    throw new AdminChatError('Cuộc trò chuyện đã đóng. Hãy mở lại trước khi phản hồi.', 409);
  }

  const now = new Date();
  const [updatedSession, message] = await prisma.$transaction([
    prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ADMIN_ACTIVE',
        assignedAdminId: session.assignedAdminId || adminId,
        acceptedAt: session.acceptedAt || now,
        closedAt: null,
        lastMessageAt: now,
      },
      select: SESSION_SELECT,
    }),
    prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'ADMIN',
        content,
        isRead: false,
      },
      select: {
        id: true,
        sessionId: true,
        sender: true,
        content: true,
        metadata: true,
        isRead: true,
        createdAt: true,
      },
    }),
    ...(session.handoffContactId
      ? [prisma.contactMessage.updateMany({
          where: { id: session.handoffContactId, status: { not: 'CLOSED' } },
          data: { status: 'REPLIED' },
        })]
      : []),
  ]);

  return { session: updatedSession, message };
}

const STATUS_LABELS: Record<ChatSessionStatus, string> = {
  AI_ACTIVE: 'Đã chuyển lại cho trợ lý tự động',
  WAITING_ADMIN: 'Đang chờ nhân viên tiếp nhận',
  ADMIN_ACTIVE: 'Nhân viên đã tiếp nhận cuộc trò chuyện',
  CLOSED: 'Cuộc trò chuyện đã được đóng',
};

export async function updateAdminChatStatus(
  sessionId: string,
  adminId: string,
  status: ChatSessionStatus
) {
  const current = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      assignedAdminId: true,
      acceptedAt: true,
      handoffContactId: true,
    },
  });

  if (!current) throw new AdminChatError('Không tìm thấy cuộc trò chuyện', 404);
  if (current.status === status) return getAdminChatSession(sessionId);

  const now = new Date();
  const data: Prisma.ChatSessionUpdateInput = {
    status,
    lastMessageAt: now,
  };

  if (status === 'ADMIN_ACTIVE') {
    data.assignedAdmin = { connect: { id: current.assignedAdminId || adminId } };
    data.acceptedAt = current.acceptedAt || now;
    data.closedAt = null;
  } else if (status === 'CLOSED') {
    data.closedAt = now;
  } else if (status === 'AI_ACTIVE') {
    data.assignedAdmin = { disconnect: true };
    data.closedAt = null;
  } else {
    data.closedAt = null;
  }

  await prisma.$transaction([
    prisma.chatSession.update({ where: { id: sessionId }, data }),
    prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'SYSTEM',
        content: STATUS_LABELS[status],
        isRead: true,
      },
    }),
    ...(current.handoffContactId && status === 'CLOSED'
      ? [prisma.contactMessage.updateMany({
          where: { id: current.handoffContactId },
          data: { status: 'CLOSED' },
        })]
      : []),
  ]);

  return getAdminChatSession(sessionId);
}

export async function getAdminChatStats() {
  const [total, aiActive, waiting, active, closed, unreadMessages] = await Promise.all([
    prisma.chatSession.count(),
    prisma.chatSession.count({ where: { status: 'AI_ACTIVE' } }),
    prisma.chatSession.count({ where: { status: 'WAITING_ADMIN' } }),
    prisma.chatSession.count({ where: { status: 'ADMIN_ACTIVE' } }),
    prisma.chatSession.count({ where: { status: 'CLOSED' } }),
    prisma.chatMessage.count({
      where: {
        sender: 'CUSTOMER',
        isRead: false,
        session: { status: { in: ['WAITING_ADMIN', 'ADMIN_ACTIVE'] } },
      },
    }),
  ]);

  return { total, aiActive, waiting, active, closed, unreadMessages };
}
