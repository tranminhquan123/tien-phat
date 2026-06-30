import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  appendContactSystemNote,
  createContact,
} from '@/services/contactService';
import { sendContactNotification } from '@/services/emailService';
import { recommendProducts } from '@/services/recommendationService';
import {
  getIntentDetails,
  getSpaceDetails,
  type AdvisoryAnalysis,
  type AdvisoryIntent,
} from '@/utils/advisoryParser';
import type { HandoffChatInput } from '@/validators/chatValidator';

const GREETING = 'Chào anh/chị, em là trợ lý tư vấn của Tiến Phát. Anh/chị đang cần tìm sản phẩm cho khu vực nào?';
const INITIAL_QUICK_REPLIES = [
  'Gạch lát nền',
  'Gạch ốp tường',
  'Gạch lát sân',
  'Tìm theo kích thước',
];
const MAX_MESSAGES_PER_SESSION = 120;

class ChatAccessError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ChatAccessError';
    this.statusCode = statusCode;
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function tokensMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function publicSession(session: {
  id: string;
  status: string;
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
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: session.id,
    status: session.status,
    customerName: session.customerName,
    phone: session.phone,
    email: session.email,
    detectedSize: session.detectedSize,
    detectedIntent: session.detectedIntent,
    detectedCategory: session.detectedCategory,
    detectedSpace: session.detectedSpace,
    detectedBrand: session.detectedBrand,
    detectedColor: session.detectedColor,
    sourcePage: session.sourcePage,
    lastMessageAt: session.lastMessageAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function previousAnalysisFromSession(session: {
  detectedSize: string | null;
  detectedIntent: string | null;
  detectedCategory: string | null;
  detectedSpace: string | null;
  detectedBrand: string | null;
  detectedColor: string | null;
}): Partial<AdvisoryAnalysis> {
  const intent = getIntentDetails(session.detectedIntent);
  const space = getSpaceDetails(session.detectedSpace);

  return {
    size: session.detectedSize || undefined,
    intent: intent?.value || (session.detectedIntent as AdvisoryIntent | null) || undefined,
    intentLabel: intent?.label,
    categorySlug: session.detectedCategory || intent?.categorySlug || undefined,
    space: session.detectedSpace || undefined,
    spaceLabel: space?.label,
    brand: session.detectedBrand || undefined,
    color: session.detectedColor || undefined,
  };
}

async function requireSession(sessionId: string, accessToken: string) {
  if (!accessToken) {
    throw new ChatAccessError('Thiếu mã truy cập cuộc trò chuyện', 401);
  }

  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session || !tokensMatch(session.accessToken, accessToken)) {
    throw new ChatAccessError('Cuộc trò chuyện không tồn tại hoặc đã hết hiệu lực', 404);
  }

  return session;
}

export function isChatAccessError(error: unknown): error is ChatAccessError {
  return error instanceof ChatAccessError;
}

export async function createChatSession(sourcePage?: string) {
  const accessToken = randomBytes(32).toString('hex');

  const session = await prisma.chatSession.create({
    data: {
      accessToken,
      sourcePage,
      messages: {
        create: {
          sender: 'ASSISTANT',
          content: GREETING,
          metadata: toJson({ quickReplies: INITIAL_QUICK_REPLIES }),
        },
      },
    },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  return {
    session: publicSession(session),
    accessToken,
    messages: session.messages,
  };
}

export async function getChatSession(sessionId: string, accessToken: string) {
  const session = await requireSession(sessionId, accessToken);
  const newestMessages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: 80,
  });

  return {
    session: publicSession(session),
    messages: newestMessages.reverse(),
  };
}

export async function sendChatMessage(
  sessionId: string,
  accessToken: string,
  content: string
) {
  const session = await requireSession(sessionId, accessToken);

  if (session.status === 'CLOSED') {
    throw new ChatAccessError('Cuộc trò chuyện này đã kết thúc', 409);
  }

  const messageCount = await prisma.chatMessage.count({ where: { sessionId } });
  if (messageCount >= MAX_MESSAGES_PER_SESSION) {
    throw new ChatAccessError('Cuộc trò chuyện đã đạt giới hạn. Vui lòng chuyển sang nhân viên tư vấn.', 409);
  }

  const customerMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      sender: 'CUSTOMER',
      content,
    },
  });

  if (session.status === 'WAITING_ADMIN' || session.status === 'ADMIN_ACTIVE') {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    });

    return {
      session: publicSession({ ...session, lastMessageAt: new Date() }),
      customerMessage,
      assistantMessage: null,
    };
  }

  const result = await recommendProducts(
    content,
    previousAnalysisFromSession(session)
  );

  const now = new Date();
  const [updatedSession, assistantMessage] = await prisma.$transaction([
    prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        detectedSize: result.analysis.size,
        detectedIntent: result.analysis.intent,
        detectedCategory: result.analysis.categorySlug,
        detectedSpace: result.analysis.space,
        detectedBrand: result.analysis.brand,
        detectedColor: result.analysis.color,
        lastMessageAt: now,
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'ASSISTANT',
        content: result.reply,
        metadata: toJson({
          recommendations: result.recommendations,
          quickReplies: result.quickReplies,
          detected: result.analysis,
        }),
      },
    }),
  ]);

  return {
    session: publicSession(updatedSession),
    customerMessage,
    assistantMessage,
  };
}

function buildConversationSummary(
  session: Awaited<ReturnType<typeof requireSession>>,
  messages: Array<{ sender: string; content: string }>,
  customerNote?: string
) {
  const intent = getIntentDetails(session.detectedIntent);
  const space = getSpaceDetails(session.detectedSpace);
  const lines = [
    'Yêu cầu chuyển từ Trợ lý tư vấn trên website',
    session.detectedSize ? `Kích thước: ${session.detectedSize.replace('x', ' x ')}` : '',
    intent ? `Nhu cầu: ${intent.label}` : '',
    space ? `Không gian: ${space.label}` : '',
    session.detectedBrand ? `Thương hiệu: ${session.detectedBrand}` : '',
    session.detectedColor ? `Màu sắc: ${session.detectedColor}` : '',
    customerNote ? `Ghi chú khách hàng: ${customerNote}` : '',
    '',
    'Nội dung hội thoại:',
    ...messages.map((message) => {
      const sender = message.sender === 'CUSTOMER' ? 'Khách' : 'Trợ lý';
      return `${sender}: ${message.content}`;
    }),
  ];

  return lines.filter((line, index, all) => {
    if (line) return true;
    return index > 0 && index < all.length - 1;
  }).join('\n');
}

export async function requestHumanHandoff(
  sessionId: string,
  accessToken: string,
  input: HandoffChatInput
) {
  const session = await requireSession(sessionId, accessToken);

  if (session.handoffContactId) {
    return {
      session: publicSession(session),
      emailSent: false,
      alreadyRequested: true,
    };
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    select: { sender: true, content: true },
    orderBy: { createdAt: 'asc' },
    take: 60,
  });
  const summary = buildConversationSummary(session, messages, input.note);
  const contact = await createContact({
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: summary,
  });

  const handoffReply = 'Tiến Phát đã tiếp nhận yêu cầu. Nhân viên sẽ liên hệ với anh/chị sớm nhất trong giờ làm việc.';
  const now = new Date();
  const [updatedSession, assistantMessage] = await prisma.$transaction([
    prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'WAITING_ADMIN',
        customerName: input.name,
        phone: input.phone,
        email: input.email,
        handoffContactId: contact.id,
        lastMessageAt: now,
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'ASSISTANT',
        content: handoffReply,
        metadata: toJson({ handoff: true, contactId: contact.id }),
      },
    }),
  ]);

  const intent = getIntentDetails(session.detectedIntent);
  const emailResult = await sendContactNotification({
    id: contact.id,
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: summary,
    inquiryType: intent?.label || 'Tư vấn từ chatbot',
    tileSize: session.detectedSize?.replace('x', ' x '),
    location: getSpaceDetails(session.detectedSpace)?.label,
    sourcePage: session.sourcePage || undefined,
    createdAt: contact.createdAt,
  });

  if (!emailResult.sent) {
    const note = emailResult.skipped
      ? `[Hệ thống] Email thông báo chatbot chưa được gửi: ${emailResult.error || 'chưa cấu hình'}.`
      : `[Hệ thống] Gửi email thông báo chatbot thất bại: ${emailResult.error || 'không xác định'}.`;

    try {
      await appendContactSystemNote(contact.id, note.slice(0, 800));
    } catch (error) {
      console.error('Không thể lưu ghi chú email của chatbot:', error);
    }
  }

  return {
    session: publicSession(updatedSession),
    assistantMessage,
    emailSent: emailResult.sent,
    alreadyRequested: false,
  };
}
