import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { closeAuditCycle, getAuditCycle, verifyAuditItem } from "../../api/audits";
import { useAuth } from "../../features/auth/useAuth";
import { Role } from "../../types/role";
import type { AuditItem, AuditItemStatus } from "../../types/audit";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/FormField";
import { StatCard } from "../../components/ui/StatCard";
import { AuditCycleStatusBadge, AuditItemStatusBadge } from "../../components/ui/AuditStatusBadge";

export function AuditCycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [verifyTarget, setVerifyTarget] = useState<{ item: AuditItem; status: AuditItemStatus } | null>(null);
  const [notes, setNotes] = useState("");

  const canManage = user?.role === Role.ORG_ADMIN || user?.role === Role.ASSET_MANAGER;

  const { data: cycle, isLoading } = useQuery({
    queryKey: ["audit-cycles", id],
    queryFn: () => getAuditCycle(id!),
    enabled: Boolean(id),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyAuditItem(id!, verifyTarget!.item.id, verifyTarget!.status, notes || undefined),
    onSuccess: () => {
      toast.success("Item updated");
      queryClient.invalidateQueries({ queryKey: ["audit-cycles"] });
      setVerifyTarget(null);
      setNotes("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update item"),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeAuditCycle(id!),
    onSuccess: () => {
      toast.success("Audit cycle closed");
      queryClient.invalidateQueries({ queryKey: ["audit-cycles"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to close audit"),
  });

  const canVerify = cycle && cycle.status !== "CLOSED" && (canManage || cycle.auditor.id === user?.id);

  if (isLoading || !cycle) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{cycle.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Auditor: {cycle.auditor.firstName} {cycle.auditor.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AuditCycleStatusBadge status={cycle.status} />
          {canManage && cycle.status !== "CLOSED" && (
            <Button size="sm" onClick={() => closeMutation.mutate()} isLoading={closeMutation.isPending}>
              Close Audit
            </Button>
          )}
        </div>
      </div>

      {cycle.discrepancies && (
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Verified" value={cycle.discrepancies.verified} />
          <StatCard label="Missing" value={cycle.discrepancies.missing} />
          <StatCard label="Damaged" value={cycle.discrepancies.damaged} />
          <StatCard label="Pending" value={cycle.discrepancies.pending} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assets in this Audit</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Tag</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(cycle.items ?? []).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">{item.asset.assetTag}</td>
                    <td className="px-4 py-3">{item.asset.name}</td>
                    <td className="px-4 py-3">
                      <AuditItemStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      {canVerify && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => setVerifyTarget({ item, status: "VERIFIED" })}>
                            Verify
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setVerifyTarget({ item, status: "MISSING" })}>
                            Missing
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setVerifyTarget({ item, status: "DAMAGED" })}>
                            Damaged
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Link to="/audits" className="mt-4 inline-block text-sm text-brand-600 hover:underline dark:text-brand-400">
        ← Back to Audit Cycles
      </Link>

      <Modal
        isOpen={verifyTarget !== null}
        onClose={() => setVerifyTarget(null)}
        title={verifyTarget ? `Mark as ${verifyTarget.status}` : ""}
      >
        <div className="space-y-4">
          <TextField label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setVerifyTarget(null)}>
              Cancel
            </Button>
            <Button isLoading={verifyMutation.isPending} onClick={() => verifyMutation.mutate()}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
