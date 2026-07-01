import type { ContactMessageStatus, ContactPriority, ContactSource, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CrmUpdateInput = {
  status?: ContactMessageStatus;
  priority?: ContactPriority;
  source?: ContactSource;
  assignedAdminId?: string | null;
  followUpAt?: Date | null;
  lastContactAt?: Date | null;
  note?: string | null;
  aiSummary?: string | null;
  leadScore?: number | null;
  extractedRequirements?: Prisma.InputJsonValue | null;
};

export async function updateCrmContact(id: string, input: CrmUpdateInput, adminId?: string) {
  const current = await prisma.contactMessage.findUnique({ where: { id } });
  if (!current) throw new Error('Không tìm thấy khách hàng');

  const data: Prisma.ContactMessageUncheckedUpdateInput = {};
  const events: Array<{ type: any; content: string }> = [];

  if (input.status !== undefined && input.status !== current.status) {
    data.status = input.status;
    events.push({ type: 'STATUS_CHANGED', content: `STATUS:${current.status}>${input.status}` });
  }
  if (input.priority !== undefined && input.priority !== current.priority) {
    data.priority = input.priority;
    events.push({ type: 'PRIORITY_CHANGED', content: `PRIORITY:${current.priority}>${input.priority}` });
  }
  if (input.source !== undefined) data.source = input.source;
  if (input.assignedAdminId !== undefined && input.assignedAdminId !== current.assignedAdminId) {
    data.assignedAdminId = input.assignedAdminId;
    events.push({ type: 'ASSIGNED', content: `ASSIGNED:${input.assignedAdminId || 'NONE'}` });
  }
  if (input.followUpAt !== undefined) {
    data.followUpAt = input.followUpAt;
    if (input.followUpAt?.getTime() !== current.followUpAt?.getTime()) {
      events.push({
        type: input.followUpAt ? 'FOLLOW_UP_SET' : 'FOLLOW_UP_COMPLETED',
        content: input.followUpAt ? `FOLLOW_UP:${input.followUpAt.toISOString()}` : 'FOLLOW_UP:CLEARED',
      });
    }
  }
  if (input.lastContactAt !== undefined) data.lastContactAt = input.lastContactAt;
  if (input.note !== undefined && input.note !== current.note) {
    data.note = input.note;
    events.push({ type: 'NOTE_ADDED', content: input.note?.trim().slice(0, 500) || 'NOTE:CLEARED' });
  }
  if (input.aiSummary !== undefined) data.aiSummary = input.aiSummary;
  if (input.leadScore !== undefined) data.leadScore = input.leadScore;
  if (input.extractedRequirements !== undefined) {
    data.extractedRequirements = input.extractedRequirements === null ? Prisma.JsonNull : input.extractedRequirements;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.contactMessage.update({
      where: { id },
      data,
      include: { assignedAdmin: { select: { id: true, name: true, username: true } } },
    });
    if (events.length) {
      await tx.contactActivity.createMany({
        data: events.map((event) => ({ ...event, contactId: id, createdByAdminId: adminId })),
      });
    }
    return updated;
  });
}
