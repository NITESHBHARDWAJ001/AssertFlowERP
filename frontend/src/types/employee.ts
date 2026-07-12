import type { Role } from "./role";

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  departmentId: string | null;
  createdAt: string;
}

export interface CreateEmployeeInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: Role;
  departmentId?: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  role?: Role;
  departmentId?: string | null;
  isActive?: boolean;
}
