import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getAsset,
  returnAsset,
  transitionAssetStatus,
  updateAsset,
  uploadAssetDocuments,
  uploadAssetImages,
} from "../../api/assets";
import { listEmployees } from "../../api/employees";
import {
  cancelTransferRequest,
  createTransferRequest,
  decideTransferRequest,
  listTransferRequests,
} from "../../api/assetTransfers";
import { useAuth } from "../../features/auth/useAuth";
import { Role } from "../../types/role";
import { ASSET_STATUS_LABELS, type AssetStatus } from "../../types/asset";
import { TRANSFER_REQUEST_STATUS_LABELS } from "../../types/assetTransfer";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { AssetStatusBadge } from "../../components/ui/AssetStatusBadge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [transitionModal, setTransitionModal] = useState<AssetStatus | null>(null);
  const [note, setNote] = useState("");
  const [holderId, setHolderId] = useState("");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [condition, setCondition] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    serialNumber: "",
    vendor: "",
    purchaseDate: "",
    purchaseCost: "",
    warrantyExpiry: "",
    location: "",
    conditionText: "",
    notes: "",
  });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferToHolderId, setTransferToHolderId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferDecisionNote, setTransferDecisionNote] = useState("");

  const canManage = user?.role === Role.ORG_ADMIN || user?.role === Role.ASSET_MANAGER;
  const canDecideTransfer =
    user?.role === Role.ORG_ADMIN || user?.role === Role.ASSET_MANAGER || user?.role === Role.DEPARTMENT_HEAD;

  const { data: asset, isLoading } = useQuery({
    queryKey: ["assets", id],
    queryFn: () => getAsset(id!),
    enabled: Boolean(id),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: listEmployees,
    enabled: canManage || user?.role === Role.DEPARTMENT_HEAD,
  });

  const { data: transferRequests = [] } = useQuery({
    queryKey: ["asset-transfers", id],
    queryFn: () => listTransferRequests(id!),
    enabled: Boolean(id),
  });

  const transitionMutation = useMutation({
    mutationFn: () =>
      transitionAssetStatus(id!, {
        toStatus: transitionModal!,
        note: note || undefined,
        toHolderId: transitionModal === "ALLOCATED" ? holderId || undefined : undefined,
      }),
    onSuccess: () => {
      toast.success("Asset status updated");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setTransitionModal(null);
      setNote("");
      setHolderId("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update status"),
  });

  const returnMutation = useMutation({
    mutationFn: () => returnAsset(id!, condition || undefined),
    onSuccess: () => {
      toast.success("Asset returned");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsReturnModalOpen(false);
      setCondition("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to return asset"),
  });

  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => uploadAssetImages(id!, files),
    onSuccess: () => {
      toast.success("Images uploaded");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to upload images"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAsset(id!, {
        name: editForm.name || undefined,
        serialNumber: editForm.serialNumber || undefined,
        vendor: editForm.vendor || undefined,
        purchaseDate: editForm.purchaseDate || undefined,
        purchaseCost: editForm.purchaseCost ? Number(editForm.purchaseCost) : undefined,
        warrantyExpiry: editForm.warrantyExpiry || undefined,
        location: editForm.location || undefined,
        condition: editForm.conditionText || undefined,
        notes: editForm.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Asset details updated");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update asset"),
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: (files: File[]) => uploadAssetDocuments(id!, files),
    onSuccess: () => {
      toast.success("Documents uploaded");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to upload documents"),
  });

  const invalidateTransfers = () => {
    queryClient.invalidateQueries({ queryKey: ["asset-transfers", id] });
    queryClient.invalidateQueries({ queryKey: ["assets"] });
  };

  const createTransferMutation = useMutation({
    mutationFn: () =>
      createTransferRequest({
        assetId: id!,
        toHolderId: transferToHolderId || undefined,
        reason: transferReason || undefined,
      }),
    onSuccess: () => {
      toast.success("Transfer request submitted");
      invalidateTransfers();
      setIsTransferModalOpen(false);
      setTransferToHolderId("");
      setTransferReason("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to submit transfer request"),
  });

  const decideTransferMutation = useMutation({
    mutationFn: ({ transferId, approve }: { transferId: string; approve: boolean }) =>
      decideTransferRequest(transferId, approve, transferDecisionNote || undefined),
    onSuccess: () => {
      toast.success("Decision recorded");
      invalidateTransfers();
      setTransferDecisionNote("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record decision"),
  });

  const cancelTransferMutation = useMutation({
    mutationFn: (transferId: string) => cancelTransferRequest(transferId),
    onSuccess: () => {
      toast.success("Transfer request cancelled");
      invalidateTransfers();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to cancel"),
  });

  const canReturn =
    asset &&
    (asset.status === "ALLOCATED" || asset.status === "TRANSFERRED") &&
    (canManage || asset.currentHolder?.id === user?.id);

  const hasPendingTransfer = transferRequests.some((r) => r.status === "PENDING");
  const canRequestTransfer = asset && asset.status === "ALLOCATED" && asset.currentHolder && !hasPendingTransfer;

  if (isLoading || !asset) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  function openEditModal() {
    setEditForm({
      name: asset!.name,
      serialNumber: asset!.serialNumber ?? "",
      vendor: asset!.vendor ?? "",
      purchaseDate: asset!.purchaseDate ? asset!.purchaseDate.slice(0, 10) : "",
      purchaseCost: asset!.purchaseCost ?? "",
      warrantyExpiry: asset!.warrantyExpiry ? asset!.warrantyExpiry.slice(0, 10) : "",
      location: asset!.location ?? "",
      conditionText: asset!.condition ?? "",
      notes: asset!.notes ?? "",
    });
    setIsEditModalOpen(true);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{asset.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{asset.assetTag}</p>
        </div>
        <div className="flex items-center gap-2">
          <AssetStatusBadge status={asset.status} />
          {canManage && (
            <Button size="sm" variant="secondary" onClick={openEditModal}>
              Edit Details
            </Button>
          )}
          {canReturn && (
            <Button size="sm" variant="secondary" onClick={() => setIsReturnModalOpen(true)}>
              Return Asset
            </Button>
          )}
          {canRequestTransfer && (
            <Button size="sm" onClick={() => setIsTransferModalOpen(true)}>
              Request Transfer
            </Button>
          )}
        </div>
      </div>

      {asset.status === "ALLOCATED" && asset.currentHolder && (
        <p className="mb-4 -mt-2 text-sm text-slate-500 dark:text-slate-400">
          Currently held by <span className="font-medium text-slate-900 dark:text-slate-100">{asset.currentHolder.firstName} {asset.currentHolder.lastName}</span>.
          {hasPendingTransfer && " A transfer request is already pending for this asset."}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardBody>
            <DetailRow label="Category" value={asset.category.name} />
            <DetailRow label="Serial Number" value={asset.serialNumber ?? "—"} />
            <DetailRow label="Vendor" value={asset.vendor ?? "—"} />
            <DetailRow label="Purchase Cost" value={asset.purchaseCost ? `₹${asset.purchaseCost}` : "—"} />
            <DetailRow
              label="Purchase Date"
              value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "—"}
            />
            <DetailRow
              label="Warranty Expiry"
              value={asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "—"}
            />
            <DetailRow label="Location" value={asset.location ?? "—"} />
            <DetailRow label="Condition" value={asset.condition ?? "—"} />
            <DetailRow
              label="Current Holder"
              value={asset.currentHolder ? `${asset.currentHolder.firstName} ${asset.currentHolder.lastName}` : "—"}
            />
            <DetailRow label="Department" value={asset.currentDepartment?.name ?? "—"} />
            <DetailRow label="Notes" value={asset.notes ?? "—"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-3">
            {asset.qrCodeUrl ? (
              <img src={asset.qrCodeUrl} alt={`QR code for ${asset.assetTag}`} className="h-40 w-40" />
            ) : (
              <p className="text-sm text-slate-400">No QR code generated</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">Scan to identify this asset</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardBody>
          {asset.images.length === 0 ? (
            <p className="text-sm text-slate-400">No images uploaded yet</p>
          ) : (
            <div className="mb-3 flex flex-wrap gap-3">
              {asset.images.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="" className="h-24 w-24 rounded-md border border-slate-200 object-cover dark:border-slate-700" />
                </a>
              ))}
            </div>
          )}
          {canManage && (
            <label className="inline-block cursor-pointer text-sm text-brand-600 hover:underline dark:text-brand-400">
              {uploadImagesMutation.isPending ? "Uploading…" : "Upload images"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadImagesMutation.isPending}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) uploadImagesMutation.mutate(files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardBody>
          {asset.documents.length === 0 ? (
            <p className="text-sm text-slate-400">No documents uploaded yet</p>
          ) : (
            <ul className="mb-3 space-y-1">
              {asset.documents.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {url.split("/").pop()}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {canManage && (
            <label className="inline-block cursor-pointer text-sm text-brand-600 hover:underline dark:text-brand-400">
              {uploadDocumentsMutation.isPending ? "Uploading…" : "Upload documents"}
              <input
                type="file"
                multiple
                className="hidden"
                disabled={uploadDocumentsMutation.isPending}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) uploadDocumentsMutation.mutate(files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </CardBody>
      </Card>

      {canManage && asset.allowedTransitions && asset.allowedTransitions.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Change Status</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {asset.allowedTransitions.map((status) => (
              <Button key={status} variant="secondary" size="sm" onClick={() => setTransitionModal(status)}>
                Move to {ASSET_STATUS_LABELS[status]}
              </Button>
            ))}
          </CardBody>
        </Card>
      )}

      {transferRequests.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Transfer Requests</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transferRequests.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {r.fromHolder ? `${r.fromHolder.firstName} ${r.fromHolder.lastName}` : "Unassigned"} → {r.toHolder.firstName} {r.toHolder.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Requested by {r.requestedBy.firstName} {r.requestedBy.lastName}
                      {r.reason ? ` — ${r.reason}` : ""} · {TRANSFER_REQUEST_STATUS_LABELS[r.status]}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {r.status === "PENDING" && canDecideTransfer && (
                      <>
                        <Button size="sm" onClick={() => decideTransferMutation.mutate({ transferId: r.id, approve: true })}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => decideTransferMutation.mutate({ transferId: r.id, approve: false })}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === "PENDING" && r.requestedBy.id === user?.id && (
                      <Button size="sm" variant="danger" onClick={() => cancelTransferMutation.mutate(r.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Asset History</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(asset.history ?? []).length === 0 && (
              <p className="px-5 py-4 text-sm text-slate-400">No history recorded yet</p>
            )}
            {(asset.history ?? []).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {entry.fromStatus ? `${ASSET_STATUS_LABELS[entry.fromStatus]} → ` : ""}
                    {entry.toStatus ? ASSET_STATUS_LABELS[entry.toStatus] : entry.action}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {entry.performedBy ? `${entry.performedBy.firstName} ${entry.performedBy.lastName}` : "System"}
                    {entry.note ? ` — ${entry.note}` : ""}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Link to="/assets" className="mt-4 inline-block text-sm text-brand-600 hover:underline dark:text-brand-400">
        ← Back to Assets
      </Link>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Asset Details">
        <div className="space-y-4">
          <TextField
            label="Asset name"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Serial number"
              value={editForm.serialNumber}
              onChange={(e) => setEditForm((f) => ({ ...f, serialNumber: e.target.value }))}
            />
            <TextField
              label="Vendor"
              value={editForm.vendor}
              onChange={(e) => setEditForm((f) => ({ ...f, vendor: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Purchase date"
              type="date"
              value={editForm.purchaseDate}
              onChange={(e) => setEditForm((f) => ({ ...f, purchaseDate: e.target.value }))}
            />
            <TextField
              label="Purchase cost"
              type="number"
              step="0.01"
              value={editForm.purchaseCost}
              onChange={(e) => setEditForm((f) => ({ ...f, purchaseCost: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Warranty expiry"
              type="date"
              value={editForm.warrantyExpiry}
              onChange={(e) => setEditForm((f) => ({ ...f, warrantyExpiry: e.target.value }))}
            />
            <TextField
              label="Location"
              placeholder="e.g. Floor 3, Room 12"
              value={editForm.location}
              onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <TextField
            label="Condition"
            placeholder="e.g. New, Good, Fair"
            value={editForm.conditionText}
            onChange={(e) => setEditForm((f) => ({ ...f, conditionText: e.target.value }))}
          />
          <TextField
            label="Notes"
            value={editForm.notes}
            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" isLoading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={transitionModal !== null}
        onClose={() => setTransitionModal(null)}
        title={transitionModal ? `Move to ${ASSET_STATUS_LABELS[transitionModal]}` : ""}
      >
        <div className="space-y-4">
          {transitionModal === "ALLOCATED" && (
            <SelectField label="Assign to" value={holderId} onChange={(e) => setHolderId(e.target.value)}>
              <option value="">Select an employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </SelectField>
          )}
          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setTransitionModal(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={transitionMutation.isPending}
              onClick={() => transitionMutation.mutate()}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Request Transfer">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {asset.currentHolder && (
              <>
                Currently held by <span className="font-medium">{asset.currentHolder.firstName} {asset.currentHolder.lastName}</span>.
              </>
            )}{" "}
            Leave "Transfer to" empty to request it for yourself.
          </p>
          <SelectField label="Transfer to (optional)" value={transferToHolderId} onChange={(e) => setTransferToHolderId(e.target.value)}>
            <option value="">Myself ({user?.firstName} {user?.lastName})</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </SelectField>
          <TextField label="Reason (optional)" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={createTransferMutation.isPending}
              onClick={() => createTransferMutation.mutate()}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Return Asset">
        <div className="space-y-4">
          <TextField
            label="Condition notes (optional)"
            placeholder="e.g. Minor scratch on lid, otherwise working fine"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" isLoading={returnMutation.isPending} onClick={() => returnMutation.mutate()}>
              Confirm Return
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
