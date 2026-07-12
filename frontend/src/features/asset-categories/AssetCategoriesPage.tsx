import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createAssetCategory,
  deleteAssetCategory,
  listAssetCategories,
} from "../../api/assetCategories";
import type { AssetCategory } from "../../types/assetCategory";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/FormField";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function AssetCategoriesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: listAssetCategories,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: Form) => createAssetCategory(values),
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create category"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssetCategory,
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to delete category"),
  });

  const columns: ColumnDef<AssetCategory, any>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Description", cell: ({ row }) => row.original.description ?? "—" },
    { header: "Custom Fields", cell: ({ row }) => row.original.customFieldsSchema?.length ?? 0 },
    { header: "Assets", cell: ({ row }) => row.original._count?.assets ?? 0 },
    {
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(row.original.id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Asset Categories</h1>
        <Button onClick={() => setIsModalOpen(true)}>New Category</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={categories} isLoading={isLoading} emptyMessage="No categories yet" />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Asset Category">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <TextField label="Category name" placeholder="e.g. IT Equipment" error={errors.name?.message} {...register("name")} />
          <TextField label="Description (optional)" error={errors.description?.message} {...register("description")} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
