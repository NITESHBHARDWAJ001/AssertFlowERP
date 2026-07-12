import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import { createDepartment, deleteDepartment, listDepartments, updateDepartment } from "../../api/departments";
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
  parentDepartmentId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: listDepartments,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: listEmployees,
  });

  const createForm = useForm<Form>({ resolver: zodResolver(schema) });
  const editForm = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: Form) =>
      createDepartment({
        name: values.name,
        headUserId: values.headUserId || undefined,
        parentDepartmentId: values.parentDepartmentId || undefined,
      }),
    onSuccess: () => {
      toast.success("Department created");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create department"),
  });

  const updateMutation = useMutation({
    mutationFn: (values: Form) =>
      updateDepartment(editingDept!.id, {
        name: values.name,
        headUserId: values.headUserId || undefined,
        parentDepartmentId: values.parentDepartmentId || undefined,
      }),
    onSuccess: () => {
      toast.success("Department updated");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setEditingDept(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update department"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      toast.success("Department deleted");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to delete department"),
  });

  function openEdit(dept: Department) {
    setEditingDept(dept);
    editForm.reset({
      name: dept.name,
      headUserId: dept.headUserId ?? "",
      parentDepartmentId: dept.parentDepartmentId ?? "",
    });
  }

  const columns: ColumnDef<Department, any>[] = [
    { header: "Name", accessorKey: "name" },
    {
      header: "Parent",
      cell: ({ row }) => departments.find((d) => d.id === row.original.parentDepartmentId)?.name ?? "—",
    },
    {
      header: "Head",
      cell: ({ row }) =>
        row.original.headUser ? `${row.original.headUser.firstName} ${row.original.headUser.lastName}` : "—",
    },
    { header: "Employees", cell: ({ row }) => row.original._count?.employees ?? 0 },
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

  function departmentFields(currentId?: string, form: typeof createForm | typeof editForm = createForm) {
    return (
      <>
        <TextField label="Department name" error={form.formState.errors.name?.message} {...form.register("name")} />
        <SelectField label="Department head (optional)" {...form.register("headUserId")}>
          <option value="">— None —</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </SelectField>
        <SelectField label="Parent department (optional)" {...form.register("parentDepartmentId")}>
          <option value="">— None —</option>
          {departments
            .filter((d) => d.id !== currentId)
            .map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
        </SelectField>
      </>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Departments</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Department</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={departments} isLoading={isLoading} emptyMessage="No departments yet" />
        </CardBody>
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Department">
        <form onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          {departmentFields(undefined, createForm)}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createForm.formState.isSubmitting || createMutation.isPending}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editingDept !== null} onClose={() => setEditingDept(null)} title="Edit Department">
        <form onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4">
          {departmentFields(editingDept?.id, editForm)}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditingDept(null)}>
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
