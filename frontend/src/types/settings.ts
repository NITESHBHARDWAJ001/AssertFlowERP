export interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  plan: string;
  assetTagPrefix: string;
  logoUrl: string | null;
  bookingRequiresApproval: boolean;
  maintenanceRequiresApproval: boolean;
}

export interface UpdateSettingsInput {
  name?: string;
  assetTagPrefix?: string;
  logoUrl?: string;
  bookingRequiresApproval?: boolean;
  maintenanceRequiresApproval?: boolean;
}
