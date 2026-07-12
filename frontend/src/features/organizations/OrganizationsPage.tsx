import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import type { ColumnDef } from "@tanstack/react-table";
import { activateOrganization, createOrganization, listOrganizations, suspendOrganization } from "../../api/organizations";
import type { Organization } from "../../types/organization";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { DataTable } from "../../components/ui/DataTable";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/FormField";

const createOrgSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens only"),
  plan: z.string().min(1),
  adminFirstName: z.string().min(1, "First name is required"),
  adminLastName: z.string().min(1, "Last name is required"),
  adminEmail: z.string().email("Enter a valid email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});
type CreateOrgForm = z.infer<typeof createOrgSchema>;

export function OrganizationsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: listOrganizations,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgForm>({ resolver: zodResolver(createOrgSchema), defaultValues: { plan: "free" } });

  const createMutation = useMutation({
    mutationFn: (values: CreateOrgForm) =>
      createOrganization({
        name: values.name,
        slug: values.slug,
        plan: values.plan,
        admin: {
          email: values.adminEmail,
          firstName: values.adminFirstName,
          lastName: values.adminLastName,
          password: values.adminPassword,
        },
      }),
    onSuccess: () => {
      toast.success("Organization created");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create organization"),
  });

  const suspendMutation = useMutation({
    mutationFn: suspendOrganization,
    onSuccess: () => {
      toast.success("Organization suspended");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateOrganization,
    onSuccess: () => {
      toast.success("Organization activated");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const columns: ColumnDef<Organization, any>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Slug", accessorKey: "slug" },
    { header: "Plan", accessorKey: "plan" },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge tone={row.original.status === "ACTIVE" ? "green" : "red"}>{row.original.status}</Badge>
      ),
    },
    { header: "Users", cell: ({ row }) => row.original._count?.users ?? 0 },
    { header: "Departments", cell: ({ row }) => row.original._count?.departments ?? 0 },
    {
      header: "Actions",
      cell: ({ row }) => {
        const org = row.original;
        return org.status === "ACTIVE" ? (
          <Button variant="danger" size="sm" onClick={() => suspendMutation.mutate(org.id)}>
            Suspend
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => activateMutation.mutate(org.id)}>
            Activate
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Organizations</h1>
        <Button onClick={() => setIsModalOpen(true)}>New Organization</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable columns={columns} data={organizations} isLoading={isLoading} emptyMessage="No organizations yet" />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Organization">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <TextField label="Organization name" error={errors.name?.message} {...register("name")} />
          <TextField label="Slug" placeholder="acme-corp" error={errors.slug?.message} {...register("slug")} />
          <TextField label="Plan" error={errors.plan?.message} {...register("plan")} />

          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              First Organization Admin
            </p>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="First name" error={errors.adminFirstName?.message} {...register("adminFirstName")} />
              <TextField label="Last name" error={errors.adminLastName?.message} {...register("adminLastName")} />
            </div>
            <div className="mt-3">
              <TextField label="Email" type="email" error={errors.adminEmail?.message} {...register("adminEmail")} />
            </div>
            <div className="mt-3">
              <TextField
                label="Temporary password"
                type="password"
                error={errors.adminPassword?.message}
                {...register("adminPassword")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Create Organization
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
