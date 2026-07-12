import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from "../../api/employees";
import { listDepartments } from "../../api/departments";
import type { Employee } from "../../types/employee";
import { Role, ROLE_LABELS } from "../../types/role";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";

const assignableRoles = [Role.ORG_ADMIN, Role.ASSET_MANAGER, Role.DEPARTMENT_HEAD, Role.EMPLOYEE] as const;

const createSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(assignableRoles),
  departmentId: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(assignableRoles),
  departmentId: z.string().optional(),
});
type EditForm = z.infer<typeof editSchema>;

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: listEmployees });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: listDepartments });

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: Role.EMPLOYEE },
  });
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) });

  const createMutation = useMutation({
    mutationFn: (values: CreateForm) =>
      createEmployee({ ...values, departmentId: values.departmentId || undefined }),
    onSuccess: () => {
      toast.success("Employee created");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create employee"),
  });

  const updateMutation = useMutation({
    mutationFn: (values: EditForm) =>
      updateEmployee(editingEmployee!.id, { ...values, departmentId: values.departmentId || null }),
    onSuccess: () => {
      toast.success("Employee updated");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditingEmployee(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update employee"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success("Employee deactivated");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  function openEdit(emp: Employee) {
    setEditingEmployee(emp);
    editForm.reset({
      firstName: emp.firstName,
      lastName: emp.lastName,
      role: emp.role as (typeof assignableRoles)[number],
      departmentId: emp.departmentId ?? "",
    });
  }

  const departmentName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? "—";

  const columns: ColumnDef<Employee, any>[] = [
    { header: "Name", cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}` },
    { header: "Email", accessorKey: "email" },
    { header: "Role", cell: ({ row }) => ROLE_LABELS[row.original.role] },
    { header: "Department", cell: ({ row }) => departmentName(row.original.departmentId) },
    {
      header: "Status",
      cell: ({ row }) => <Badge tone={row.original.isActive ? "green" : "slate"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>,
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(row.original)}>
            Edit / Promote
          </Button>
          <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(row.original.id)}>
            Deactivate
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Employees</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Employee</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={employees} isLoading={isLoading} emptyMessage="No employees yet" />
        </CardBody>
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Employee">
        <form onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="First name" error={createForm.formState.errors.firstName?.message} {...createForm.register("firstName")} />
            <TextField label="Last name" error={createForm.formState.errors.lastName?.message} {...createForm.register("lastName")} />
          </div>
          <TextField label="Email" type="email" error={createForm.formState.errors.email?.message} {...createForm.register("email")} />
          <TextField
            label="Temporary password"
            type="password"
            error={createForm.formState.errors.password?.message}
            {...createForm.register("password")}
          />
          <SelectField label="Role" error={createForm.formState.errors.role?.message} {...createForm.register("role")}>
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Department (optional)" {...createForm.register("departmentId")}>
            <option value="">— None —</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </SelectField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createForm.formState.isSubmitting || createMutation.isPending}>
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editingEmployee !== null} onClose={() => setEditingEmployee(null)} title="Edit Employee">
        <form onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="First name" error={editForm.formState.errors.firstName?.message} {...editForm.register("firstName")} />
            <TextField label="Last name" error={editForm.formState.errors.lastName?.message} {...editForm.register("lastName")} />
          </div>
          <SelectField label="Role" error={editForm.formState.errors.role?.message} {...editForm.register("role")}>
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Department (optional)" {...editForm.register("departmentId")}>
            <option value="">— None —</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </SelectField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditingEmployee(null)}>
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
