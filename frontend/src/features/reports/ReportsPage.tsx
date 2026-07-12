import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { downloadReport, getReportData, type ReportData, type ReportType } from "../../api/reports";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "assets", label: "Asset Report" },
  { value: "departments", label: "Department Report" },
  { value: "maintenance", label: "Maintenance Report" },
  { value: "bookings", label: "Booking Report" },
  { value: "audits", label: "Audit Report" },
];

export function ReportsPage() {
  const [selected, setSelected] = useState<ReportType>("assets");
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ["reports", selected],
    queryFn: () => getReportData(selected),
  });
  const columns = report?.columns ?? [];
  const rows = report?.rows ?? [];

  const handleDownload = async (format: "csv" | "excel" | "pdf") => {
    setDownloading(format);
    try {
      await downloadReport(selected, format);
    } catch {
      toast.error("Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Reports</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.value}
            type="button"
            onClick={() => setSelected(rt.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              selected === rt.value
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {rt.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{report?.title ?? "Report"}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" isLoading={downloading === "csv"} onClick={() => handleDownload("csv")}>
              Export CSV
            </Button>
            <Button size="sm" variant="secondary" isLoading={downloading === "excel"} onClick={() => handleDownload("excel")}>
              Export Excel
            </Button>
            <Button size="sm" variant="secondary" isLoading={downloading === "pdf"} onClick={() => handleDownload("pdf")}>
              Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-medium">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td colSpan={columns.length || 1} className="px-4 py-8 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length || 1} className="px-4 py-8 text-center text-slate-400">
                      No data yet
                    </td>
                  </tr>
                )}
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {String(row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
