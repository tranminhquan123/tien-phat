// src/services/contactService.ts
import { prisma } from '@/lib/prisma';
import type { ContactMessageStatus } from '@/types';

export async function createContact(data: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}) {
  return prisma.contactMessage.create({ data });
}

export async function appendContactSystemNote(id: string, systemNote: string) {
  const contact = await prisma.contactMessage.findUnique({
    where: { id },
    select: { note: true },
  });

  const note = [contact?.note?.trim(), systemNote.trim()]
    .filter(Boolean)
    .join('\n\n');

  return prisma.contactMessage.update({
    where: { id },
    data: { note },
  });
}

export async function getContacts(params: {
  status?: ContactMessageStatus;
  page?: number;
  limit?: number;
}) {
  const { status, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  return { messages, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateContactStatus(
  id: string,
  status: ContactMessageStatus,
  note?: string
) {
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
