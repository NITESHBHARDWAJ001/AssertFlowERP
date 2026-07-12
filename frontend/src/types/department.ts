export interface Department {
  id: string;
  organizationId: string;
  name: string;
  parentDepartmentId: string | null;
  headUserId: string | null;
  headUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  _count?: { employees: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  parentDepartmentId?: string;
  headUserId?: string;
}

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;
