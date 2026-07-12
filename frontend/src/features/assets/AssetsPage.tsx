import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { createAsset, listAssets } from "../../api/assets";
import { listAssetCategories } from "../../api/assetCategories";
import { listDepartments } from "../../api/departments";
import type { Asset } from "../../types/asset";
import { useAuth } from "../../features/auth/useAuth";
import { Role } from "../../types/role";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";
import { AssetStatusBadge } from "../../components/ui/AssetStatusBadge";
import { ASSET_STATUS_LABELS, AssetStatus } from "../../types/asset";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  serialNumber: z.string().optional(),
  vendor: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  location: z.string().optional(),
  condition: z.string().optional(),
  currentDepartmentId: z.string().optional(),
  notes: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function AssetsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const canManage = user?.role === Role.ORG_ADMIN || user?.role === Role.ASSET_MANAGER;

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets", { search, statusFilter, categoryFilter, locationFilter }],
    queryFn: () =>
      listAssets({
        search: search || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        location: locationFilter || undefined,
      }),
  });

  const { data: categories = [] } = useQuery({ queryKey: ["asset-categories"], queryFn: listAssetCategories });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: listDepartments, enabled: canManage });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: Form) =>
      createAsset({
        ...values,
        purchaseDate: values.purchaseDate || undefined,
        purchaseCost: values.purchaseCost ? Number(values.purchaseCost) : undefined,
        warrantyExpiry: values.warrantyExpiry || undefined,
        location: values.location || undefined,
        condition: values.condition || undefined,
        currentDepartmentId: values.currentDepartmentId || undefined,
      }),
    onSuccess: () => {
      toast.success("Asset registered");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to register asset"),
  });

  const columns = useMemo<ColumnDef<Asset, any>[]>(
    () => [
      {
        header: "Tag",
        cell: ({ row }) => (
          <Link to={`/assets/${row.original.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            {row.original.assetTag}
          </Link>
        ),
      },
      { header: "Name", accessorKey: "name" },
      { header: "Category", cell: ({ row }) => row.original.category.name },
      { header: "Status", cell: ({ row }) => <AssetStatusBadge status={row.original.status} /> },
      {
        header: "Holder",
        cell: ({ row }) =>
          row.original.currentHolder
            ? `${row.original.currentHolder.firstName} ${row.original.currentHolder.lastName}`
            : "—",
      },
      { header: "Department", cell: ({ row }) => row.original.currentDepartment?.name ?? "—" },
      { header: "Location", cell: ({ row }) => row.original.location ?? "—" },
    ],
    []
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Assets</h1>
        {canManage && <Button onClick={() => setIsModalOpen(true)}>Register Asset</Button>}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, tag, or serial number…"
          className="min-w-[220px] flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AssetStatus | "")}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All statuses</option>
          {Object.values(AssetStatus).map((s) => (
            <option key={s} value={s}>
              {ASSET_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Filter by location…"
          className="min-w-[160px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{canManage ? "All Assets" : "My Assets"}</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={assets} isLoading={isLoading} emptyMessage="No assets found" />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Asset">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <TextField label="Asset name" placeholder="e.g. Dell Latitude 5420" error={errors.name?.message} {...register("name")} />
          <SelectField label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Serial number" error={errors.serialNumber?.message} {...register("serialNumber")} />
            <TextField label="Vendor" error={errors.vendor?.message} {...register("vendor")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Purchase date" type="date" error={errors.purchaseDate?.message} {...register("purchaseDate")} />
            <TextField label="Purchase cost" type="number" step="0.01" error={errors.purchaseCost?.message} {...register("purchaseCost")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Warranty expiry" type="date" error={errors.warrantyExpiry?.message} {...register("warrantyExpiry")} />
            <TextField label="Location (optional)" placeholder="e.g. Floor 3, Room 12" error={errors.location?.message} {...register("location")} />
          </div>
          <TextField label="Condition (optional)" placeholder="e.g. New, Good, Fair" error={errors.condition?.message} {...register("condition")} />
          <SelectField label="Department (optional)" {...register("currentDepartmentId")}>
            <option value="">— None —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectField>
          <TextField label="Notes (optional)" error={errors.notes?.message} {...register("notes")} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Register Asset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
