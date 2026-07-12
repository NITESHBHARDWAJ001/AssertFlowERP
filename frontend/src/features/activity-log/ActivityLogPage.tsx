import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { listActivityLogs, type ActivityLog } from "../../api/activityLogs";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";

export function ActivityLogPage() {
  const { data: logs = [], isLoading } = useQuery({ queryKey: ["activity-logs"], queryFn: listActivityLogs });

  const columns: ColumnDef<ActivityLog, any>[] = [
    { header: "When", cell: ({ row }) => new Date(row.original.createdAt).toLocaleString() },
    {
      header: "Who",
      cell: ({ row }) =>
        row.original.user ? `${row.original.user.firstName} ${row.original.user.lastName}` : "System",
    },
    { header: "Action", accessorKey: "action" },
    { header: "Entity", cell: ({ row }) => row.original.entityType },
    { header: "IP Address", cell: ({ row }) => row.original.ipAddress ?? "—" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Activity Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={logs} isLoading={isLoading} emptyMessage="No activity recorded yet" />
        </CardBody>
      </Card>
    </div>
  );
}
