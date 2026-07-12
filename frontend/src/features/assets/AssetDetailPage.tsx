import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getAsset, returnAsset, transitionAssetStatus, uploadAssetDocuments, uploadAssetImages } from "../../api/assets";
import { listEmployees } from "../../api/employees";
import { useAuth } from "../../features/auth/useAuth";
import { Role } from "../../types/role";
import { ASSET_STATUS_LABELS, type AssetStatus } from "../../types/asset";
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

  const canManage = user?.role === Role.ORG_ADMIN || user?.role === Role.ASSET_MANAGER;

  const { data: asset, isLoading } = useQuery({
    queryKey: ["assets", id],
    queryFn: () => getAsset(id!),
    enabled: Boolean(id),
  });

  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: listEmployees, enabled: canManage });

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

  const uploadDocumentsMutation = useMutation({
    mutationFn: (files: File[]) => uploadAssetDocuments(id!, files),
    onSuccess: () => {
      toast.success("Documents uploaded");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to upload documents"),
  });

  const canReturn =
    asset &&
    (asset.status === "ALLOCATED" || asset.status === "TRANSFERRED") &&
    (canManage || asset.currentHolder?.id === user?.id);

  if (isLoading || !asset) {
    return <p className="text-sm text-slate-400">Loading…</p>;
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
          {canReturn && (
            <Button size="sm" variant="secondary" onClick={() => setIsReturnModalOpen(true)}>
              Return Asset
            </Button>
          )}
        </div>
      </div>

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
