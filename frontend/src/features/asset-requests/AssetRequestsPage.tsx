import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  assetManagerDecision,
  cancelAssetRequest,
  createAssetRequest,
  deptHeadDecision,
  listAssetRequests,
} from "../../api/assetRequests";
import { listAssetCategories } from "../../api/assetCategories";
import { listAssets } from "../../api/assets";
import { useAuth } from "../../features/auth/useAuth";
import { Role } from "../../types/role";
import type { AssetRequest } from "../../types/assetRequest";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";
import { AssetRequestStatusBadge } from "../../components/ui/AssetRequestStatusBadge";

const schema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  reason: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function AssetRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decisionRequest, setDecisionRequest] = useState<AssetRequest | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [pickedAssetId, setPickedAssetId] = useState("");

  const { data: requests = [], isLoading } = useQuery({ queryKey: ["asset-requests"], queryFn: listAssetRequests });
  const { data: categories = [] } = useQuery({ queryKey: ["asset-categories"], queryFn: listAssetCategories });
  const { data: availableAssets = [] } = useQuery({
    queryKey: ["assets", "available", decisionRequest?.category.id],
    queryFn: () => listAssets({ status: "AVAILABLE", categoryId: decisionRequest!.category.id }),
    enabled: Boolean(decisionRequest) && user?.role !== Role.DEPARTMENT_HEAD,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: Form) => createAssetRequest(values),
    onSuccess: () => {
      toast.success("Request submitted");
      queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to submit request"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelAssetRequest,
    onSuccess: () => {
      toast.success("Request cancelled");
      queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to cancel"),
  });

  const deptDecisionMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => deptHeadDecision(id, approve, decisionNote || undefined),
    onSuccess: () => {
      toast.success("Decision recorded");
      queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
      setDecisionRequest(null);
      setDecisionNote("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record decision"),
  });

  const managerDecisionMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      assetManagerDecision(id, approve, approve ? pickedAssetId : undefined, decisionNote || undefined),
    onSuccess: () => {
      toast.success("Decision recorded");
      queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setDecisionRequest(null);
      setDecisionNote("");
      setPickedAssetId("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record decision"),
  });

  const canActAsDeptHead = user?.role === Role.DEPARTMENT_HEAD || user?.role === Role.ORG_ADMIN;
  const canActAsManager = user?.role === Role.ASSET_MANAGER || user?.role === Role.ORG_ADMIN;
  const isEmployee = user?.role === Role.EMPLOYEE;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Asset Requests</h1>
        <Button onClick={() => setIsModalOpen(true)}>Request Asset</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEmployee ? "My Requests" : "Requests"}</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Requested By</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No requests yet
                    </td>
                  </tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      {r.requestedBy.firstName} {r.requestedBy.lastName}
                    </td>
                    <td className="px-4 py-3">{r.category.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.reason ?? "—"}</td>
                    <td className="px-4 py-3">
                      <AssetRequestStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">{r.asset ? r.asset.assetTag : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {r.status === "PENDING_DEPT_HEAD" && canActAsDeptHead && (
                          <Button size="sm" onClick={() => setDecisionRequest(r)}>
                            Review
                          </Button>
                        )}
                        {r.status === "PENDING_ASSET_MANAGER" && canActAsManager && (
                          <Button size="sm" onClick={() => setDecisionRequest(r)}>
                            Review
                          </Button>
                        )}
                        {isEmployee &&
                          r.requestedBy.id === user?.id &&
                          (r.status === "PENDING_DEPT_HEAD" || r.status === "PENDING_ASSET_MANAGER") && (
                            <Button variant="danger" size="sm" onClick={() => cancelMutation.mutate(r.id)}>
                              Cancel
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request an Asset">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <SelectField label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <TextField label="Reason (optional)" error={errors.reason?.message} {...register("reason")} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={decisionRequest !== null}
        onClose={() => {
          setDecisionRequest(null);
          setDecisionNote("");
          setPickedAssetId("");
        }}
        title="Review Asset Request"
      >
        {decisionRequest && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">
                {decisionRequest.requestedBy.firstName} {decisionRequest.requestedBy.lastName}
              </span>{" "}
              requested a <span className="font-medium">{decisionRequest.category.name}</span> asset.
              {decisionRequest.reason && <> Reason: {decisionRequest.reason}</>}
            </p>

            {decisionRequest.status === "PENDING_ASSET_MANAGER" && canActAsManager && (
              <SelectField
                label="Assign asset"
                value={pickedAssetId}
                onChange={(e) => setPickedAssetId(e.target.value)}
              >
                <option value="">Select an available asset…</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} — {a.name}
                  </option>
                ))}
              </SelectField>
            )}

            <TextField label="Note (optional)" value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="danger"
                onClick={() => {
                  if (decisionRequest.status === "PENDING_DEPT_HEAD") {
                    deptDecisionMutation.mutate({ id: decisionRequest.id, approve: false });
                  } else {
                    managerDecisionMutation.mutate({ id: decisionRequest.id, approve: false });
                  }
                }}
                isLoading={deptDecisionMutation.isPending || managerDecisionMutation.isPending}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  if (decisionRequest.status === "PENDING_DEPT_HEAD") {
                    deptDecisionMutation.mutate({ id: decisionRequest.id, approve: true });
                  } else {
                    if (!pickedAssetId) {
                      toast.error("Select an asset to allocate");
                      return;
                    }
                    managerDecisionMutation.mutate({ id: decisionRequest.id, approve: true });
                  }
                }}
                isLoading={deptDecisionMutation.isPending || managerDecisionMutation.isPending}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
