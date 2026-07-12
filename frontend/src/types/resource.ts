export const ResourceType = {
  MEETING_ROOM: "MEETING_ROOM",
  VEHICLE: "VEHICLE",
  PROJECTOR: "PROJECTOR",
  EQUIPMENT: "EQUIPMENT",
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  MEETING_ROOM: "Meeting Room",
  VEHICLE: "Vehicle",
  PROJECTOR: "Projector",
  EQUIPMENT: "Equipment",
};

export interface BookableResource {
  id: string;
  organizationId: string;
  name: string;
  type: ResourceType;
  location: string | null;
  capacity: number | null;
  description: string | null;
  createdAt: string;
}

export interface CreateResourceInput {
  name: string;
  type: ResourceType;
  location?: string;
  capacity?: number;
  description?: string;
}
