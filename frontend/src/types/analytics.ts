export interface NameCount {
  name: string;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface Utilization {
  totalAssets: number;
  allocatedAssets: number;
  utilizationRate: number;
}

export interface DepartmentPerformance {
  name: string;
  assetCount: number;
  maintenanceCount: number;
}

export interface AnalyticsData {
  assetsByCategory: NameCount[];
  assetsByDepartment: NameCount[];
  assetsByStatus: StatusCount[];
  utilization: Utilization;
  maintenanceTrend: LabelCount[];
  monthlyAllocation: LabelCount[];
  bookingsByDay: LabelCount[];
  departmentPerformance: DepartmentPerformance[];
}
