import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createAssetCategory,
  deleteAssetCategory,
  listAssetCategories,
  updateAssetCategory,
} from "../../api/assetCategories";
import type { AssetCategory } from "../../types/assetCategory";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";

const fieldTypeOptions = ["text", "number", "date", "boolean"] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  customFields: z.array(
    z.object({
      key: z.string().min(1, "Key is required"),
      label: z.string().min(1, "Label is required"),
      type: z.enum(fieldTypeOptions),
    })
  ),
});
type Form = z.infer<typeof schema>;

function useCategoryForm() {
  return useForm<Form>({ resolver: zodResolver(schema), defaultValues: { customFields: [] } });
}

export function AssetCategoriesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: listAssetCategories,
  });

  const createForm = useCategoryForm();
  const editForm = useCategoryForm();
  const createFields = useFieldArray({ control: createForm.control, name: "customFields" });
  const editFields = useFieldArray({ control: editForm.control, name: "customFields" });

  const createMutation = useMutation({
    mutationFn: (values: Form) =>
      createAssetCategory({
        name: values.name,
        description: values.description || undefined,
        customFieldsSchema: values.customFields.length > 0 ? values.customFields : undefined,
      }),
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      setIsCreateOpen(false);
      createForm.reset({ name: "", description: "", customFields: [] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: (values: Form) =>
      updateAssetCategory(editingCategory!.id, {
        name: values.name,
        description: values.description || undefined,
        customFieldsSchema: values.customFields,
      }),
    onSuccess: () => {
      toast.success("Category updated");
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      setEditingCategory(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssetCategory,
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to delete category"),
  });

  function openEdit(category: AssetCategory) {
    setEditingCategory(category);
    editForm.reset({
      name: category.name,
      description: category.description ?? "",
      customFields: category.customFieldsSchema ?? [],
    });
  }

  const columns: ColumnDef<AssetCategory, any>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Description", cell: ({ row }) => row.original.description ?? "—" },
    { header: "Custom Fields", cell: ({ row }) => row.original.customFieldsSchema?.length ?? 0 },
    { header: "Assets", cell: ({ row }) => row.original._count?.assets ?? 0 },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(row.original)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(row.original.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  function renderCustomFieldsBuilder(
    form: ReturnType<typeof useCategoryForm>,
    fields: ReturnType<typeof useFieldArray<Form, "customFields">>
  ) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Custom fields (optional)
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fields.append({ key: "", label: "", type: "text" })}
          >
            + Add field
          </Button>
        </div>
        <div className="space-y-3">
          {fields.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_120px_auto] items-end gap-2">
              <TextField
                label="Key"
                placeholder="e.g. cpu"
                error={form.formState.errors.customFields?.[index]?.key?.message}
                {...form.register(`customFields.${index}.key` as const)}
              />
              <TextField
                label="Label"
                placeholder="e.g. CPU"
                error={form.formState.errors.customFields?.[index]?.label?.message}
                {...form.register(`customFields.${index}.label` as const)}
              />
              <SelectField label="Type" {...form.register(`customFields.${index}.type` as const)}>
                {fieldTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectField>
              <Button type="button" variant="danger" size="sm" onClick={() => fields.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
          {fields.fields.length === 0 && (
            <p className="text-sm text-slate-400">No custom fields defined for this category.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Asset Categories</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Category</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={categories} isLoading={isLoading} emptyMessage="No categories yet" />
        </CardBody>
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Asset Category">
        <form onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <TextField
            label="Category name"
            placeholder="e.g. IT Equipment"
            error={createForm.formState.errors.name?.message}
            {...createForm.register("name")}
          />
          <TextField
            label="Description (optional)"
            error={createForm.formState.errors.description?.message}
            {...createForm.register("description")}
          />
          {renderCustomFieldsBuilder(createForm, createFields)}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createForm.formState.isSubmitting || createMutation.isPending}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editingCategory !== null} onClose={() => setEditingCategory(null)} title="Edit Asset Category">
        <form onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4">
          <TextField
            label="Category name"
            error={editForm.formState.errors.name?.message}
            {...editForm.register("name")}
          />
          <TextField
            label="Description (optional)"
            error={editForm.formState.errors.description?.message}
            {...editForm.register("description")}
          />
          {renderCustomFieldsBuilder(editForm, editFields)}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={editForm.formState.isSubmitting || updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
