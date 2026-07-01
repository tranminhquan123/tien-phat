import { prisma } from '@/lib/prisma';
import { vietnamDayBounds } from '@/services/crmListService';

export async function getCrmContactDetail(id: string) {
  const contact = await prisma.contactMessage.findUnique({
    where: { id },
    include: {
      assignedAdmin: { select: { id: true, name: true, username: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 120,
        include: { createdByAdmin: { select: { id: true, name: true, username: true } } },
      },
    },
  });
  if (!contact) throw new Error('Không tìm thấy khách hàng');

  const linkedChat = await prisma.chatSession.findFirst({
    where: { handoffContactId: id },
    select: {
      id: true,
      status: true,
      lastMessageAt: true,
      aiSummary: true,
      leadScore: true,
      extractedRequirements: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 160,
        select: { id: true, sender: true, content: true, metadata: true, isRead: true, createdAt: true, sessionId: true },
      },
    },
  });

  return { contact, linkedChat };
}

export async function getCrmStats() {
  const { start, end } = vietnamDayBounds();
  const active = ['NEW', 'READING', 'RECEIVED', 'CONSULTING', 'WAITING_CUSTOMER', 'QUOTED', 'REPLIED'] as const;
  const [total, newCount, consulting, waitingCustomer, quoted, won, lost, highPriority, followUpToday, overdue] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { status: { in: ['NEW', 'READING'] } } }),
    prisma.contactMessage.count({ where: { status: { in: ['RECEIVED', 'CONSULTING', 'REPLIED'] } } }),
    prisma.contactMessage.count({ where: { status: 'WAITING_CUSTOMER' } }),
    prisma.contactMessage.count({ where: { status: 'QUOTED' } }),
    prisma.contactMessage.count({ where: { status: 'WON' } }),
    prisma.contactMessage.count({ where: { status: 'LOST' } }),
    prisma.contactMessage.count({ where: { priority: 'HIGH', status: { in: [...active] } } }),
    prisma.contactMessage.count({ where: { followUpAt: { gte: start, lt: end }, status: { in: [...active] } } }),
    prisma.contactMessage.count({ where: { followUpAt: { lt: start }, status: { in: [...active] } } }),
  ]);

  return { total, new: newCount, consulting, waitingCustomer, quoted, won, lost, highPriority, followUpToday, overdue };
}

export async function getCrmOptions() {
  const admins = await prisma.admin.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, username: true },
    orderBy: { name: 'asc' },
  });
  return { admins };
}
