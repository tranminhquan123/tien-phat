import { prisma } from '@/lib/prisma';
import { EmployeeError } from '@/services/employeeQueryService';

const ACTIVE_CONTACT_STATUSES = [
  'NEW',
  'READING',
  'RECEIVED',
  'CONSULTING',
  'WAITING_CUSTOMER',
  'QUOTED',
  'REPLIED',
] as const;

export async function reassignEmployeeWork(
  actorId: string,
  sourceAdminId: string,
  targetAdminId: string
) {
  if (sourceAdminId === targetAdminId) {
    throw new EmployeeError('Người nhận bàn giao phải khác nhân viên hiện tại', 400);
  }

  const [actor, source, target] = await Promise.all([
    prisma.admin.findUnique({
      where: { id: actorId },
      select: { id: true, role: true, isActive: true, deletedAt: true },
    }),
    prisma.admin.findUnique({
      where: { id: sourceAdminId },
      select: { id: true, name: true, role: true },
    }),
    prisma.admin.findFirst({
      where: { id: targetAdminId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);

  if (!actor || !actor.isActive || actor.deletedAt) {
    throw new EmployeeError('Tài khoản thực hiện không còn hoạt động', 403);
  }
  if (!source) throw new EmployeeError('Không tìm thấy nhân viên cần bàn giao', 404);
  if (!target) throw new EmployeeError('Người nhận bàn giao không hoạt động', 400);
  if (actor.role !== 'OWNER' && !(actor.role === 'MANAGER' && source.role === 'STAFF')) {
    throw new EmployeeError('Bạn không có quyền bàn giao dữ liệu của nhân viên này', 403);
  }

  const [contacts, chats] = await Promise.all([
    prisma.contactMessage.findMany({
      where: {
        assignedAdminId: sourceAdminId,
        status: { in: [...ACTIVE_CONTACT_STATUSES] },
      },
      select: { id: true },
    }),
    prisma.chatSession.findMany({
      where: {
        assignedAdminId: sourceAdminId,
        status: { in: ['WAITING_ADMIN', 'ADMIN_ACTIVE'] },
      },
      select: { id: true },
    }),
  ]);

  await prisma.$transaction(async (tx) => {
    if (contacts.length) {
      await tx.contactMessage.updateMany({
        where: { id: { in: contacts.map(({ id }) => id) } },
        data: { assignedAdminId: target.id },
      });
      await tx.contactActivity.createMany({
        data: contacts.map(({ id }) => ({
          contactId: id,
          type: 'ASSIGNED',
          content: `Bàn giao khách hàng từ ${source.name} cho ${target.name}`,
          createdByAdminId: actorId,
        })),
      });
    }

    if (chats.length) {
      await tx.chatSession.updateMany({
        where: { id: { in: chats.map(({ id }) => id) } },
        data: { assignedAdminId: target.id },
      });
      await tx.chatMessage.createMany({
        data: chats.map(({ id }) => ({
          sessionId: id,
          sender: 'SYSTEM',
          content: `Hội thoại đã được bàn giao từ ${source.name} cho ${target.name}`,
          isRead: true,
        })),
      });
    }

    await tx.adminAuditLog.create({
      data: {
        actorAdminId: actorId,
        targetAdminId: sourceAdminId,
        action: 'EMPLOYEE_REASSIGNED',
        metadata: {
          reassignToAdminId: target.id,
          contactCount: contacts.length,
          chatCount: chats.length,
        },
      },
    });
  });

  return {
    reassignToAdminId: target.id,
    reassignToName: target.name,
    contactCount: contacts.length,
    chatCount: chats.length,
  };
}
