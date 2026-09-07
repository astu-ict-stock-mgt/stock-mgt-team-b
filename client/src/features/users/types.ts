export type Role =
  | 'ADMINISTRATOR'
  | 'PAO'
  | 'STOREKEEPER'
  | 'STOCK_CLERK'
  | 'ACCOUNTANT'
  | 'DEPARTMENT_HEAD'
  | 'SECURITY_OFFICER';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department?: string | null;
  isActive?: boolean;
  status?: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department?: string | null;
  password?: string;
  status?: UserStatus;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  department?: string | null;
  password?: string;
  status?: UserStatus;
}

export interface PaginatedUsers {
  data: User[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FetchUsersParams {
  search?: string;
  role?: Role | '';
  status?: UserStatus | '';
  page?: number;
  pageSize?: number;
}
