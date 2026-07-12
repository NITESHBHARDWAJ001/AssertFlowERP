import { apiClient } from "./client";

export type ReportType = "assets" | "departments" | "maintenance" | "bookings" | "audits";
export type ReportFormat = "csv" | "excel" | "pdf";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ReportData {
  title: string;
  columns: { key: string; header: string }[];
  rows: Record<string, unknown>[];
}

export async function getReportData(type: ReportType): Promise<ReportData> {
  const { data } = await apiClient.get<ApiEnvelope<ReportData>>(`/reports/${type}`);
  return data.data;
}

const EXTENSIONS: Record<ReportFormat, string> = { csv: "csv", excel: "xlsx", pdf: "pdf" };

export async function downloadReport(type: ReportType, format: ReportFormat): Promise<void> {
  const response = await apiClient.get(`/reports/${type}`, {
    params: { format },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}-report.${EXTENSIONS[format]}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
