import axios from 'axios';
import type { User, CreateUserDto, UpdateUserDto, PaginatedUsers, FetchUsersParams } from './types';

const API_BASE_URL = '/api/users';

// Initial mock dataset covering all 7 SRS roles
let mockUsers: User[] = [
  {
    id: 'usr-001',
    email: 'admin@system.local',
    firstName: 'Marcus',
    lastName: 'Vance',
    role: 'ADMINISTRATOR',
    department: 'ICT Administration',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:30:00.000Z',
  },
  {
    id: 'usr-002',
    email: 'henok.pao@system.local',
    firstName: 'Henok',
    lastName: 'Tadesse',
    role: 'PAO',
    department: 'Property Administration',
    status: 'ACTIVE',
    createdAt: '2026-01-18T09:15:00.000Z',
  },
  {
    id: 'usr-003',
    email: 'almaz.store@system.local',
    firstName: 'Almaz',
    lastName: 'Bekele',
    role: 'STOREKEEPER',
    department: 'Central Warehouse',
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'usr-004',
    email: 'dawit.clerk@system.local',
    firstName: 'Dawit',
    lastName: 'Mekonnen',
    role: 'STOCK_CLERK',
    department: 'Central Warehouse',
    status: 'ACTIVE',
    createdAt: '2026-02-05T11:20:00.000Z',
  },
  {
    id: 'usr-005',
    email: 'selam.acc@system.local',
    firstName: 'Selam',
    lastName: 'Alemu',
    role: 'ACCOUNTANT',
    department: 'Finance & Accounts',
    status: 'ACTIVE',
    createdAt: '2026-02-10T14:45:00.000Z',
  },
  {
    id: 'usr-006',
    email: 'dr.chala.cse@system.local',
    firstName: 'Dr. Chala',
    lastName: 'Girma',
    role: 'DEPARTMENT_HEAD',
    department: 'Computer Science & Eng.',
    status: 'ACTIVE',
    createdAt: '2026-02-12T16:00:00.000Z',
  },
  {
    id: 'usr-007',
    email: 'yohannes.sec@system.local',
    firstName: 'Yohannes',
    lastName: 'Kassaye',
    role: 'SECURITY_OFFICER',
    department: 'Campus Security',
    status: 'ACTIVE',
    createdAt: '2026-02-15T07:30:00.000Z',
  },
  {
    id: 'usr-008',
    email: 'bethlehem.former@system.local',
    firstName: 'Bethlehem',
    lastName: 'Haile',
    role: 'STOCK_CLERK',
    department: 'Procurement Unit',
    status: 'INACTIVE',
    createdAt: '2025-11-20T08:00:00.000Z',
  },
];

export class ApiError extends Error {
  field?: string;
  statusCode?: number;

  constructor(message: string, field?: string, statusCode = 400) {
    super(message);
    this.name = 'ApiError';
    this.field = field;
    this.statusCode = statusCode;
  }
}

export async function fetchUsers(params: FetchUsersParams = {}): Promise<PaginatedUsers> {
  const { search = '', role = '', status = '', page = 1, pageSize = 10 } = params;

  try {
    const res = await axios.get<PaginatedUsers>(API_BASE_URL, {
      params: { search, role, status, page, pageSize },
    });
    return res.data;
  } catch {
    // Fallback to simulated local mock data for client development
    await new Promise((resolve) => setTimeout(resolve, 300));

    let filtered = [...mockUsers];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }

    const totalCount = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data: paginatedData,
      totalCount,
      page,
      pageSize,
    };
  }
}

export async function fetchUserById(id: string): Promise<User> {
  try {
    const res = await axios.get<User>(`${API_BASE_URL}/${id}`);
    return res.data;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const user = mockUsers.find((u) => u.id === id);
    if (!user) throw new ApiError('User not found', undefined, 404);
    return user;
  }
}

export async function createUser(data: CreateUserDto): Promise<User> {
  try {
    const res = await axios.post<User>(API_BASE_URL, data);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const respData = error.response.data as {
        message?: string;
        field?: string;
        errors?: Record<string, string>;
      };
      throw new ApiError(
        respData.message || 'Failed to create user',
        respData.field || (respData.errors?.email ? 'email' : undefined),
        error.response.status
      );
    }

    // Mock implementation with duplicate email check
    await new Promise((resolve) => setTimeout(resolve, 400));
    const duplicate = mockUsers.find(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (duplicate) {
      throw new ApiError('A user with this email address already exists.', 'email', 409);
    }

    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: data.role,
      department: data.department?.trim() || null,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    mockUsers = [newUser, ...mockUsers];
    return newUser;
  }
}

export async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  try {
    const res = await axios.put<User>(`${API_BASE_URL}/${id}`, data);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const respData = error.response.data as {
        message?: string;
        field?: string;
        errors?: Record<string, string>;
      };
      throw new ApiError(
        respData.message || 'Failed to update user',
        respData.field || (respData.errors?.email ? 'email' : undefined),
        error.response.status
      );
    }

    // Mock update implementation
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new ApiError('User not found', undefined, 404);
    }

    if (data.email) {
      const duplicate = mockUsers.find(
        (u) => u.id !== id && u.email.toLowerCase() === data.email!.trim().toLowerCase()
      );
      if (duplicate) {
        throw new ApiError('A user with this email address already exists.', 'email', 409);
      }
    }

    const updatedUser: User = {
      ...mockUsers[index],
      ...data,
      firstName: data.firstName !== undefined ? data.firstName.trim() : mockUsers[index].firstName,
      lastName: data.lastName !== undefined ? data.lastName.trim() : mockUsers[index].lastName,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : mockUsers[index].email,
      department:
        data.department !== undefined
          ? data.department.trim() || null
          : mockUsers[index].department,
      updatedAt: new Date().toISOString(),
    };

    mockUsers[index] = updatedUser;
    return updatedUser;
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 300));
    mockUsers = mockUsers.filter((u) => u.id !== id);
  }
}
