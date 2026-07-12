export type OrganizationStatus = "ACTIVE" | "SUSPENDED";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  plan: string;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; departments: number };
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  plan: string;
  admin: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  };
}
