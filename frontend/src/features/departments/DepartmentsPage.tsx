import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import { createDepartment, deleteDepartment, listDepartments } from "../../api/departments";
import { listEmployees } from "../../api/employees";
import type { Department } from "../../types/department";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  headUserId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: listDepartments,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: listEmployees,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: Form) =>
      createDepartment({ name: values.name, headUserId: values.headUserId || undefined }),
    onSuccess: () => {
      toast.success("Department created");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create department"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      toast.success("Department deleted");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });

  const columns: ColumnDef<Department, any>[] = [
    { header: "Name", accessorKey: "name" },
    {
      header: "Head",
      cell: ({ row }) =>
        row.original.headUser ? `${row.original.headUser.firstName} ${row.original.headUser.lastName}` : "—",
    },
    { header: "Employees", cell: ({ row }) => row.original._count?.employees ?? 0 },
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Departments</h1>
        <Button onClick={() => setIsModalOpen(true)}>New Department</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={departments} isLoading={isLoading} emptyMessage="No departments yet" />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Department">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <TextField label="Department name" error={errors.name?.message} {...register("name")} />
          <SelectField label="Department head (optional)" {...register("headUserId")}>
            <option value="">— None —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </SelectField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
