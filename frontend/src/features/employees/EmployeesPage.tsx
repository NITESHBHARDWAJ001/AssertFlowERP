import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import { createEmployee, deleteEmployee, listEmployees } from "../../api/employees";
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

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(assignableRoles),
  departmentId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: employees = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: listEmployees });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: listDepartments });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { role: Role.EMPLOYEE } });

  const createMutation = useMutation({
    mutationFn: (values: Form) =>
      createEmployee({ ...values, departmentId: values.departmentId || undefined }),
    onSuccess: () => {
      toast.success("Employee created");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create employee"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success("Employee deactivated");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

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
        <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate(row.original.id)}>
          Deactivate
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Employees</h1>
        <Button onClick={() => setIsModalOpen(true)}>New Employee</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={employees} isLoading={isLoading} emptyMessage="No employees yet" />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Employee">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="First name" error={errors.firstName?.message} {...register("firstName")} />
            <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <TextField label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <TextField
            label="Temporary password"
            type="password"
            error={errors.password?.message}
            {...register("password")}
          />
          <SelectField label="Role" error={errors.role?.message} {...register("role")}>
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Department (optional)" {...register("departmentId")}>
            <option value="">— None —</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </SelectField>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Create Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
