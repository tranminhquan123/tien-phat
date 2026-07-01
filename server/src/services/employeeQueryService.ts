import type { AdminRole, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export class EmployeeError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = 'EmployeeError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const EMPLOYEE_SELECT = {
  id: true,
  username: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  passwordChangedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminSelect;

const ACTIVE_CONTACT_STATUSES = [
  'NEW',
  'READING',
  'RECEIVED',
  'CONSULTING',
  'WAITING_CUSTOMER',
  'QUOTED',
  'REPLIED',
] as const;

function clamp(value: number | undefined, fallback: number, maximum: number) {
  if (!value || !Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), maximum);
}

export async function listEmployees(params: {
  search?: string;
  role?: AdminRole;
  status?: 'ACTIVE' | 'INACTIVE';
  page?: number;
  limit?: number;
}) {
  const page = clamp(params.page, 1, 100000);
  const limit = clamp(params.limit, 20, 100);
  const search = params.search?.trim();
  const where: Prisma.AdminWhereInput = {
    ...(params.role && { role: params.role }),
    ...(params.status === 'ACTIVE' && { isActive: true, deletedAt: null }),
    ...(params.status === 'INACTIVE' && { OR: [{ isActive: false }, { deletedAt: { not: null } }] }),
    ...(search && {
      AND: [{
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }],
    }),
  };

  const [employees, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      select: {
        ...EMPLOYEE_SELECT,
        _count: {
          select: {
            assignedContacts: {
              where: { status: { in: [...ACTIVE_CONTACT_STATUSES] } },
            },
            chatSessions: {
              where: { status: { in: ['WAITING_ADMIN', 'ADMIN_ACTIVE'] } },
            },
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.admin.count({ where }),
  ]);

  return {
    employees: employees.map((employee) => ({
      ...employee,
      activeContactCount: employee._count.assignedContacts,
      activeChatCount: employee._count.chatSessions,
      _count: undefined,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getEmployeeDetail(id: string) {
  const employee = await prisma.admin.findUnique({
    where: { id },
    select: {
      ...EMPLOYEE_SELECT,
      assignedContacts: {
        where: { status: { in: [...ACTIVE_CONTACT_STATUSES] } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          priority: true,
          followUpAt: true,
          updatedAt: true,
        },
      },
      chatSessions: {
        where: { status: { in: ['WAITING_ADMIN', 'ADMIN_ACTIVE'] } },
        orderBy: { lastMessageAt: 'desc' },
        take: 20,
        select: {
          id: true,
          customerName: true,
          phone: true,
          status: true,
          lastMessageAt: true,
        },
      },
      auditTargets: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          action: true,
          metadata: true,
          createdAt: true,
          actorAdmin: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });

  if (!employee) throw new EmployeeError('Không tìm thấy nhân viên', 404);
  return employee;
}

export async function getEmployeeStats() {
  const [total, active, inactive, owners, managers, staff, assigned] = await Promise.all([
    prisma.admin.count(),
    prisma.admin.count({ where: { isActive: true, deletedAt: null } }),
    prisma.admin.count({ where: { OR: [{ isActive: false }, { deletedAt: { not: null } }] } }),
    prisma.admin.count({ where: { role: 'OWNER', isActive: true, deletedAt: null } }),
    prisma.admin.count({ where: { role: 'MANAGER', isActive: true, deletedAt: null } }),
    prisma.admin.count({ where: { role: 'STAFF', isActive: true, deletedAt: null } }),
    prisma.admin.count({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { assignedContacts: { some: { status: { in: [...ACTIVE_CONTACT_STATUSES] } } } },
          { chatSessions: { some: { status: { in: ['WAITING_ADMIN', 'ADMIN_ACTIVE'] } } } },
        ],
      },
    }),
  ]);

  return { total, active, inactive, owners, managers, staff, assigned };
}

export async function getAssignableEmployees() {
  return prisma.admin.findMany({
    where: { isActive: true, deletedAt: null },
    select: EMPLOYEE_SELECT,
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
}
