import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import { createResource, deleteResource, listResources } from "../../api/resources";
import type { BookableResource } from "../../types/resource";
import { ResourceType, RESOURCE_TYPE_LABELS } from "../../types/resource";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum([ResourceType.MEETING_ROOM, ResourceType.VEHICLE, ResourceType.PROJECTOR, ResourceType.EQUIPMENT]),
  location: z.string().optional(),
  capacity: z.string().optional(),
  description: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function ResourcesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: resources = [], isLoading } = useQuery({ queryKey: ["resources"], queryFn: listResources });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { type: ResourceType.MEETING_ROOM } });

  const createMutation = useMutation({
    mutationFn: (values: Form) =>
      createResource({
        ...values,
        capacity: values.capacity ? Number(values.capacity) : undefined,
      }),
    onSuccess: () => {
      toast.success("Resource created");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create resource"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      toast.success("Resource deleted");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to delete resource"),
  });

  const columns: ColumnDef<BookableResource, any>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Type", cell: ({ row }) => RESOURCE_TYPE_LABELS[row.original.type] },
    { header: "Location", cell: ({ row }) => row.original.location ?? "—" },
    { header: "Capacity", cell: ({ row }) => row.original.capacity ?? "—" },
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
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resources</h1>
        <Button onClick={() => setIsModalOpen(true)}>New Resource</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookable Resources</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={resources} isLoading={isLoading} emptyMessage="No resources yet" />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Resource">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <TextField label="Name" placeholder="e.g. Conference Room A" error={errors.name?.message} {...register("name")} />
          <SelectField label="Type" error={errors.type?.message} {...register("type")}>
            {Object.values(ResourceType).map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABELS[t]}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Location (optional)" error={errors.location?.message} {...register("location")} />
            <TextField label="Capacity (optional)" type="number" error={errors.capacity?.message} {...register("capacity")} />
          </div>
          <TextField label="Description (optional)" error={errors.description?.message} {...register("description")} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Create Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
