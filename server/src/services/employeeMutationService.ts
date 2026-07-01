import bcrypt from 'bcryptjs';
import type { AdminRole, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { EMPLOYEE_SELECT, EmployeeError } from '@/services/employeeQueryService';

const ACTIVE_CONTACT_STATUSES = [
  'NEW', 'READING', 'RECEIVED', 'CONSULTING',
  'WAITING_CUSTOMER', 'QUOTED', 'REPLIED',
] as const;

async function getActor(actorId: string) {
  const actor = await prisma.admin.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, isActive: true, deletedAt: true },
  });
  if (!actor || !actor.isActive || actor.deletedAt) {
    throw new EmployeeError('Tài khoản thực hiện không còn hoạt động', 403);
  }
  return actor;
}

function assertCanManage(actorRole: AdminRole, targetRole: AdminRole) {
  if (actorRole === 'OWNER') return;
  if (actorRole === 'MANAGER' && targetRole === 'STAFF') return;
  throw new EmployeeError('Bạn không có quyền quản lý nhân viên này', 403);
}

function assertCanGrant(actorRole: AdminRole, role: AdminRole) {
  if (actorRole === 'OWNER') return;
  if (actorRole === 'MANAGER' && role === 'STAFF') return;
  throw new EmployeeError('Bạn không có quyền cấp vai trò này', 403);
}

async function assertUniqueIdentity(params: {
  username?: string;
  email?: string | null;
  excludeId?: string;
}) {
  const clauses: Prisma.AdminWhereInput[] = [];
  if (params.username) clauses.push({ username: params.username.toLowerCase() });
  if (params.email) clauses.push({ email: params.email.toLowerCase() });
  if (!clauses.length) return;

  const duplicate = await prisma.admin.findFirst({
    where: {
      ...(params.excludeId && { id: { not: params.excludeId } }),
      OR: clauses,
    },
    select: { username: true, email: true },
  });

  if (!duplicate) return;
  if (params.username && duplicate.username === params.username.toLowerCase()) {
    throw new EmployeeError('Tên đăng nhập đã tồn tại', 409);
  }
  throw new EmployeeError('Email đã được sử dụng', 409);
}

async function assertOwnerContinuity(targetId: string, currentRole: AdminRole, nextRole?: AdminRole) {
  if (currentRole !== 'OWNER' || nextRole === 'OWNER') return;
  const activeOwners = await prisma.admin.count({
    where: { role: 'OWNER', isActive: true, deletedAt: null },
  });
  const target = await prisma.admin.findUnique({ where: { id: targetId }, select: { isActive: true, deletedAt: true } });
  if (target?.isActive && !target.deletedAt && activeOwners <= 1) {
    throw new EmployeeError('Không thể thay đổi OWNER đang hoạt động cuối cùng', 409);
  }
}

export async function createEmployee(
  actorId: string,
  input: {
    name: string;
    username: string;
    email?: string | null;
    phone?: string | null;
    role: AdminRole;
    password: string;
  }
) {
  const actor = await getActor(actorId);
  assertCanGrant(actor.role, input.role);
  const username = input.username.toLowerCase();
  const email = input.email?.toLowerCase() || null;
  await assertUniqueIdentity({ username, email });
  const password = await bcrypt.hash(input.password, 12);

  return prisma.$transaction(async (tx) => {
    const employee = await tx.admin.create({
      data: {
        name: input.name.trim(),
        username,
        email,
        phone: input.phone?.trim() || null,
        role: input.role,
        password,
        isActive: true,
      },
      select: EMPLOYEE_SELECT,
    });
    await tx.adminAuditLog.create({
      data: {
        actorAdminId: actorId,
        targetAdminId: employee.id,
        action: 'EMPLOYEE_CREATED',
        metadata: { role: employee.role, username: employee.username },
      },
    });
    return employee;
  });
}

export async function updateEmployee(
  actorId: string,
  targetId: string,
  input: {
    name?: string;
    username?: string;
    email?: string | null;
    phone?: string | null;
    role?: AdminRole;
    isActive?: boolean;
  }
) {
  const actor = await getActor(actorId);
  const current = await prisma.admin.findUnique({ where: { id: targetId }, select: EMPLOYEE_SELECT });
  if (!current) throw new EmployeeError('Không tìm thấy nhân viên', 404);
  assertCanManage(actor.role, current.role);

  if (input.role) assertCanGrant(actor.role, input.role);
  if (targetId === actorId && input.role && input.role !== current.role) {
    throw new EmployeeError('Bạn không thể tự thay đổi vai trò của mình', 409);
  }
  if (input.isActive === false) {
    throw new EmployeeError('Hãy dùng thao tác vô hiệu hóa để xử lý bàn giao dữ liệu', 409);
  }
  await assertOwnerContinuity(targetId, current.role, input.role);

  const username = input.username?.toLowerCase();
  const email = input.email === undefined ? undefined : input.email?.toLowerCase() || null;
  await assertUniqueIdentity({ username, email, excludeId: targetId });

  const data: Prisma.AdminUpdateInput = {
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(username !== undefined && { username }),
    ...(email !== undefined && { email }),
    ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
    ...(input.role !== undefined && { role: input.role }),
  };
  let action: 'EMPLOYEE_UPDATED' | 'EMPLOYEE_REACTIVATED' = 'EMPLOYEE_UPDATED';
  if (input.isActive === true && (!current.isActive || current.deletedAt)) {
    data.isActive = true;
    data.deletedAt = null;
    data.authVersion = { increment: 1 };
    action = 'EMPLOYEE_REACTIVATED';
  }

  const changedFields = Object.keys(input).filter((key) => input[key as keyof typeof input] !== undefined);
  return prisma.$transaction(async (tx) => {
    const employee = await tx.admin.update({ where: { id: targetId }, data, select: EMPLOYEE_SELECT });
    await tx.adminAuditLog.create({
      data: {
        actorAdminId: actorId,
        targetAdminId: targetId,
        action,
        metadata: { changedFields },
      },
    });
    return employee;
  });
}

export async function resetEmployeePassword(
  actorId: string,
  targetId: string,
  newPassword: string
) {
  const actor = await getActor(actorId);
  const target = await prisma.admin.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target) throw new EmployeeError('Không tìm thấy nhân viên', 404);
  assertCanManage(actor.role, target.role);
  if (actorId === targetId) {
    throw new EmployeeError('Hãy đổi mật khẩu của bạn trong trang Cài đặt', 409);
  }

  const password = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.admin.update({
      where: { id: targetId },
      data: {
        password,
        passwordChangedAt: new Date(),
        authVersion: { increment: 1 },
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorAdminId: actorId,
        targetAdminId: targetId,
        action: 'EMPLOYEE_PASSWORD_RESET',
      },
    }),
  ]);
}

export async function disableEmployee(
  actorId: string,
  targetId: string,
  reassignToAdminId?: string | null
) {
  const actor = await getActor(actorId);
  const target = await prisma.admin.findUnique({
    where: { id: targetId },
    select: { ...EMPLOYEE_SELECT },
  });
  if (!target) throw new EmployeeError('Không tìm thấy nhân viên', 404);
  assertCanManage(actor.role, target.role);
  if (actorId === targetId) throw new EmployeeError('Bạn không thể vô hiệu hóa chính mình', 409);
  await assertOwnerContinuity(targetId, target.role, 'STAFF');

  const [contactIds, chatIds] = await Promise.all([
    prisma.contactMessage.findMany({
      where: { assignedAdminId: targetId, status: { in: [...ACTIVE_CONTACT_STATUSES] } },
      select: { id: true },
    }),
    prisma.chatSession.findMany({
      where: { assignedAdminId: targetId, status: { in: ['WAITING_ADMIN', 'ADMIN_ACTIVE'] } },
      select: { id: true },
    }),
  ]);

  if ((contactIds.length || chatIds.length) && !reassignToAdminId) {
    throw new EmployeeError(
      'Nhân viên đang phụ trách dữ liệu. Hãy chọn người nhận bàn giao trước khi vô hiệu hóa.',
      409,
      { activeContactCount: contactIds.length, activeChatCount: chatIds.length }
    );
  }

  let replacement: { id: string; name: string } | null = null;
  if (reassignToAdminId) {
    if (reassignToAdminId === targetId) throw new EmployeeError('Người nhận bàn giao không hợp lệ', 400);
    replacement = await prisma.admin.findFirst({
      where: { id: reassignToAdminId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!replacement) throw new EmployeeError('Người nhận bàn giao không hoạt động', 400);
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    if (replacement && contactIds.length) {
      await tx.contactMessage.updateMany({
        where: { id: { in: contactIds.map((item) => item.id) } },
        data: { assignedAdminId: replacement.id },
      });
      await tx.contactActivity.createMany({
        data: contactIds.map((item) => ({
          contactId: item.id,
          type: 'ASSIGNED',
          content: `Bàn giao khách hàng cho ${replacement?.name}`,
          createdByAdminId: actorId,
        })),
      });
    }

    if (replacement && chatIds.length) {
      await tx.chatSession.updateMany({
        where: { id: { in: chatIds.map((item) => item.id) } },
        data: { assignedAdminId: replacement.id },
      });
      await tx.chatMessage.createMany({
        data: chatIds.map((item) => ({
          sessionId: item.id,
          sender: 'SYSTEM',
          content: `Hội thoại đã được bàn giao cho ${replacement?.name}`,
          isRead: true,
        })),
      });
    }

    await tx.admin.update({
      where: { id: targetId },
      data: {
        isActive: false,
        deletedAt: now,
        authVersion: { increment: 1 },
      },
    });
    await tx.adminAuditLog.create({
      data: {
        actorAdminId: actorId,
        targetAdminId: targetId,
        action: 'EMPLOYEE_DISABLED',
        metadata: {
          reassignToAdminId: replacement?.id || null,
          contactCount: contactIds.length,
          chatCount: chatIds.length,
        },
      },
    });
    if (replacement && (contactIds.length || chatIds.length)) {
      await tx.adminAuditLog.create({
        data: {
          actorAdminId: actorId,
          targetAdminId: targetId,
          action: 'EMPLOYEE_REASSIGNED',
          metadata: {
            reassignToAdminId: replacement.id,
            contactCount: contactIds.length,
            chatCount: chatIds.length,
          },
        },
      });
    }
  });

  return { disabled: true, contactCount: contactIds.length, chatCount: chatIds.length };
}
