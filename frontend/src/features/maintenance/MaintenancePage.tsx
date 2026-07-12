import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  assignTechnician,
  createMaintenanceRequest,
  decideMaintenanceRequest,
  listMaintenanceRequests,
  resolveMaintenanceRequest,
  startMaintenanceProgress,
  uploadMaintenancePhotos,
} from "../../api/maintenance";
import { listAssets } from "../../api/assets";
import { listEmployees } from "../../api/employees";
import { useAuth } from "../../features/auth/useAuth";
import { Role } from "../../types/role";
import { MaintenancePriority } from "../../types/maintenance";
import type { MaintenanceRequest } from "../../types/maintenance";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";
import { MaintenanceStatusBadge } from "../../components/ui/MaintenanceStatusBadge";
import { PriorityBadge } from "../../components/ui/PriorityBadge";

const schema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum([MaintenancePriority.LOW, MaintenancePriority.MEDIUM, MaintenancePriority.HIGH, MaintenancePriority.CRITICAL]),
});
type Form = z.infer<typeof schema>;

export function MaintenancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<MaintenanceRequest | null>(null);
  const [technicianId, setTechnicianId] = useState("");
  const [resolveTarget, setResolveTarget] = useState<MaintenanceRequest | null>(null);
  const [resolution, setResolution] = useState("");
  const [rejectTarget, setRejectTarget] = useState<MaintenanceRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [photosTarget, setPhotosTarget] = useState<MaintenanceRequest | null>(null);

  const canDecide = user?.role === Role.ORG_ADMIN || user?.role === Role.ASSET_MANAGER;

  const { data: requests = [], isLoading } = useQuery({ queryKey: ["maintenance"], queryFn: listMaintenanceRequests });
  const { data: assets = [] } = useQuery({ queryKey: ["assets"], queryFn: () => listAssets() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: listEmployees, enabled: canDecide });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { priority: MaintenancePriority.MEDIUM } });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    queryClient.invalidateQueries({ queryKey: ["assets"] });
  };

  const createMutation = useMutation({
    mutationFn: (values: Form) => createMaintenanceRequest(values),
    onSuccess: () => {
      toast.success("Maintenance request raised");
      invalidate();
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to raise request"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => decideMaintenanceRequest(id, true),
    onSuccess: () => {
      toast.success("Request approved");
      invalidate();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => decideMaintenanceRequest(rejectTarget!.id, false, rejectionReason || undefined),
    onSuccess: () => {
      toast.success("Request rejected");
      invalidate();
      setRejectTarget(null);
      setRejectionReason("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to reject"),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignTechnician(assignTarget!.id, technicianId),
    onSuccess: () => {
      toast.success("Technician assigned");
      invalidate();
      setAssignTarget(null);
      setTechnicianId("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to assign technician"),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startMaintenanceProgress(id),
    onSuccess: () => {
      toast.success("Work started");
      invalidate();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to start work"),
  });

  const resolveMutation = useMutation({
    mutationFn: () => resolveMaintenanceRequest(resolveTarget!.id, resolution),
    onSuccess: () => {
      toast.success("Marked as resolved");
      invalidate();
      setResolveTarget(null);
      setResolution("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to resolve"),
  });

  const isTechnician = (r: MaintenanceRequest) => r.technician?.id === user?.id;

  const uploadPhotosMutation = useMutation({
    mutationFn: (files: File[]) => uploadMaintenancePhotos(photosTarget!.id, files),
    onSuccess: (updated) => {
      toast.success("Photos uploaded");
      invalidate();
      setPhotosTarget(updated);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to upload photos"),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Maintenance</h1>
        <Button onClick={() => setIsModalOpen(true)}>Raise Request</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Raised By</th>
                  <th className="px-4 py-3 font-medium">Technician</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No maintenance requests yet
                    </td>
                  </tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">{r.asset.assetTag}</td>
                    <td className="px-4 py-3">{r.title}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-4 py-3">
                      {r.raisedBy.firstName} {r.raisedBy.lastName}
                    </td>
                    <td className="px-4 py-3">{r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : "—"}</td>
                    <td className="px-4 py-3">
                      <MaintenanceStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setPhotosTarget(r)}>
                          Photos {r.photos.length > 0 ? `(${r.photos.length})` : ""}
                        </Button>
                        {canDecide && r.status === "PENDING" && (
                          <>
                            <Button size="sm" onClick={() => approveMutation.mutate(r.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setRejectTarget(r)}>
                              Reject
                            </Button>
                          </>
                        )}
                        {canDecide && r.status === "APPROVED" && (
                          <Button size="sm" onClick={() => setAssignTarget(r)}>
                            Assign Technician
                          </Button>
                        )}
                        {(canDecide || isTechnician(r)) && r.status === "TECHNICIAN_ASSIGNED" && (
                          <Button size="sm" onClick={() => startMutation.mutate(r.id)}>
                            Start Work
                          </Button>
                        )}
                        {(canDecide || isTechnician(r)) && r.status === "IN_PROGRESS" && (
                          <Button size="sm" onClick={() => setResolveTarget(r)}>
                            Resolve
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Raise Maintenance Request">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <SelectField label="Asset" error={errors.assetId?.message} {...register("assetId")}>
            <option value="">Select an asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.assetTag} — {a.name}
              </option>
            ))}
          </SelectField>
          <TextField label="Title" placeholder="e.g. Screen flickers on boot" error={errors.title?.message} {...register("title")} />
          <SelectField label="Priority" error={errors.priority?.message} {...register("priority")}>
            {Object.values(MaintenancePriority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </SelectField>
          <TextField label="Description (optional)" error={errors.description?.message} {...register("description")} />

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

      <Modal isOpen={rejectTarget !== null} onClose={() => setRejectTarget(null)} title="Reject Request">
        <div className="space-y-4">
          <TextField
            label="Reason (optional)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={assignTarget !== null} onClose={() => setAssignTarget(null)} title="Assign Technician">
        <div className="space-y-4">
          <SelectField label="Technician" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
            <option value="">Select an employee…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </SelectField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button
              isLoading={assignMutation.isPending}
              onClick={() => {
                if (!technicianId) {
                  toast.error("Select a technician");
                  return;
                }
                assignMutation.mutate();
              }}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={photosTarget !== null} onClose={() => setPhotosTarget(null)} title="Maintenance Photos">
        <div className="space-y-4">
          {photosTarget && photosTarget.photos.length === 0 && (
            <p className="text-sm text-slate-400">No photos uploaded yet</p>
          )}
          {photosTarget && photosTarget.photos.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {photosTarget.photos.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="" className="h-24 w-24 rounded-md border border-slate-200 object-cover dark:border-slate-700" />
                </a>
              ))}
            </div>
          )}
          <label className="inline-block cursor-pointer text-sm text-brand-600 hover:underline dark:text-brand-400">
            {uploadPhotosMutation.isPending ? "Uploading…" : "Upload photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadPhotosMutation.isPending}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) uploadPhotosMutation.mutate(files);
                e.target.value = "";
              }}
            />
          </label>
          <div className="flex justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setPhotosTarget(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={resolveTarget !== null} onClose={() => setResolveTarget(null)} title="Resolve Request">
        <div className="space-y-4">
          <TextField
            label="Resolution notes"
            placeholder="e.g. Replaced the display cable"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setResolveTarget(null)}>
              Cancel
            </Button>
            <Button
              isLoading={resolveMutation.isPending}
              onClick={() => {
                if (!resolution.trim()) {
                  toast.error("Add resolution notes");
                  return;
                }
                resolveMutation.mutate();
              }}
            >
              Mark Resolved
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
