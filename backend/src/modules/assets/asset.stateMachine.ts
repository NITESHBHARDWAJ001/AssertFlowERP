import { AssetStatus } from "@prisma/client";

// Practical lifecycle graph (not strictly linear - assets cycle between
// Available/Allocated/Maintenance/Returned many times before Retired).
// Encodes the business rules: assets under maintenance or retired cannot be
// allocated, and an already-allocated asset can't be allocated again without
// first passing through Returned/Available.
const TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  REGISTERED: [AssetStatus.AVAILABLE],
  AVAILABLE: [AssetStatus.ALLOCATED, AssetStatus.RESERVED, AssetStatus.MAINTENANCE, AssetStatus.RETIRED, AssetStatus.LOST],
  ALLOCATED: [AssetStatus.TRANSFERRED, AssetStatus.RETURNED, AssetStatus.MAINTENANCE, AssetStatus.LOST],
  TRANSFERRED: [AssetStatus.ALLOCATED, AssetStatus.RETURNED, AssetStatus.LOST],
  RESERVED: [AssetStatus.ALLOCATED, AssetStatus.AVAILABLE, AssetStatus.LOST],
  MAINTENANCE: [AssetStatus.AVAILABLE, AssetStatus.RETIRED, AssetStatus.LOST],
  RETURNED: [AssetStatus.AVAILABLE, AssetStatus.MAINTENANCE],
  LOST: [AssetStatus.AVAILABLE, AssetStatus.RETIRED],
  RETIRED: [AssetStatus.DISPOSED],
  DISPOSED: [],
};

export function isTransitionAllowed(from: AssetStatus, to: AssetStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(from: AssetStatus): AssetStatus[] {
  return TRANSITIONS[from] ?? [];
}
