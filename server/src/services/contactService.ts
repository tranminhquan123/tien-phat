import { prisma } from '@/lib/prisma';
import type { ContactMessageStatus } from '@/types';

export async function createContact(data: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}) {
  const source = data.message.includes('Yêu cầu chuyển từ Trợ lý tư vấn')
    ? 'CHATBOT'
    : 'CONTACT_FORM';

  return prisma.contactMessage.create({
    data: {
      ...data,
      source,
      activities: {
        create: {
          type: 'CREATED',
          content: source === 'CHATBOT'
            ? 'Khách hàng được tạo từ yêu cầu chuyển tiếp chatbot'
            : 'Khách hàng gửi biểu mẫu liên hệ trên website',
        },
      },
    },
  });
}

export async function appendContactSystemNote(id: string, systemNote: string) {
  const contact = await prisma.contactMessage.findUnique({
    where: { id },
    select: { note: true },
  });
  const note = [contact?.note?.trim(), systemNote.trim()].filter(Boolean).join('\n\n');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.contactMessage.update({ where: { id }, data: { note } });
    await tx.contactActivity.create({
      data: {
        contactId: id,
        type: 'SYSTEM',
        content: systemNote.trim().slice(0, 1000),
      },
    });
    return updated;
  });
}

export async function getContacts(params: {
  status?: ContactMessageStatus;
  page?: number;
  limit?: number;
}) {
  const { status, page = 1, limit = 20 } = params;
  const where = status ? { status } : {};
  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);
  return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateContactStatus(id: string, status: ContactMessageStatus, note?: string) {
  return prisma.contactMessage.update({
    where: { id },
    data: { status, ...(note !== undefined && { note }) },
  });
}

export async function getContactStats() {
  const [total, newCount, replied] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
    prisma.contactMessage.count({ where: { status: 'REPLIED' } }),
  ]);
  return { total, new: newCount, replied };
}
