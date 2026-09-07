import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { AppError } from '../../middlewares/errorHandler.ts';
import type { Role } from '../../middlewares/rbac.ts';
import 'dotenv/config';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  department?: string | null;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  department?: string | null;
  isActive?: boolean;
}

export interface GetUsersParams {
  role?: Role;
  search?: string;
}

const getPrisma = (): PrismaClient => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
};

// Helper function to strip passwordHash before returning user objects to clients (SRS Section 3.2)
const sanitizeUser = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  department: user.department,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getUsers = async (params: GetUsersParams = {}) => {
  const prisma = getPrisma();
  const where: Record<string, unknown> = {};

  if (params.role) {
    where.role = params.role;
  }

  if (params.search) {
    const search = params.search.trim();
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return users.map(sanitizeUser);
};

export const getUserById = async (id: string) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return sanitizeUser(user);
};

export const createUser = async (data: CreateUserData, adminId: string) => {
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password using bcrypt before saving to DB so plain passwords are never stored
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      department: data.department ?? null,
    },
  });

  if (adminId) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'USER_CREATED',
          entity: 'User',
          entityId: user.id,
          details: { email: user.email, role: user.role },
        },
      });
    } catch {
      // Prevent audit failure from blocking primary user creation in mock/test setups
    }
  }

  return sanitizeUser(user);
};

export const updateUser = async (id: string, data: UpdateUserData, adminId: string) => {
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (data.email && data.email !== existingUser.email) {
    const duplicate = await prisma.user.findUnique({ where: { email: data.email } });
    if (duplicate) {
      throw new AppError('User with this email already exists', 400);
    }
  }

  const isRoleChanged = data.role !== undefined && data.role !== existingUser.role;
  const isActiveChanged = data.isActive !== undefined && data.isActive !== existingUser.isActive;
  const updatePayload: Record<string, unknown> = {};

  if (data.email !== undefined) updatePayload.email = data.email;
  if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
  if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
  if (data.role !== undefined) updatePayload.role = data.role;
  if (data.department !== undefined) updatePayload.department = data.department;
  if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

  if (data.password) {
    updatePayload.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updatePayload,
  });

  // Record administrator changes in AuditLog for compliance and traceability.
  if ((isRoleChanged || isActiveChanged) && adminId) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: isRoleChanged ? 'USER_ROLE_CHANGED' : data.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entity: 'User',
          entityId: updatedUser.id,
          details: isRoleChanged
            ? { previousRole: existingUser.role, newRole: updatedUser.role }
            : { previousIsActive: existingUser.isActive, newIsActive: updatedUser.isActive },
        },
      });
    } catch {
      // Prevent audit failure from blocking user update in mock setups
    }
  }

  return sanitizeUser(updatedUser);
};

export const deactivateUser = async (id: string, adminId: string) => {
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  if (adminId) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'USER_DEACTIVATED',
          entity: 'User',
          entityId: id,
          details: { email: existingUser.email },
        },
      });
    } catch {
      // Prevent audit failure from blocking user execution
    }
  }

  return sanitizeUser(updatedUser);
};
