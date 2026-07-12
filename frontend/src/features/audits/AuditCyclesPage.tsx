import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { createAuditCycle, listAuditCycles } from "../../api/audits";
import { listEmployees } from "../../api/employees";
import { useAuth } from "../../features/auth/useAuth";
import { Role } from "../../types/role";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";
import { AuditCycleStatusBadge } from "../../components/ui/AuditStatusBadge";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  auditorId: z.string().min(1, "Auditor is required"),
  description: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function AuditCyclesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canCreate = user?.role === Role.ORG_ADMIN;

  const { data: cycles = [], isLoading } = useQuery({ queryKey: ["audit-cycles"], queryFn: listAuditCycles });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: listEmployees, enabled: canCreate });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: Form) => createAuditCycle(values),
    onSuccess: () => {
      toast.success("Audit cycle created");
      queryClient.invalidateQueries({ queryKey: ["audit-cycles"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create audit cycle"),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Audit Cycles</h1>
        {canCreate && <Button onClick={() => setIsModalOpen(true)}>New Audit Cycle</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Audit Cycles</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Auditor</th>
                  <th className="px-4 py-3 font-medium">Assets</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && cycles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No audit cycles yet
                    </td>
                  </tr>
                )}
                {cycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <Link to={`/audits/${c.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {c.auditor.firstName} {c.auditor.lastName}
                    </td>
                    <td className="px-4 py-3">{c._count?.items ?? 0}</td>
                    <td className="px-4 py-3">
                      <AuditCycleStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(c.startDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Audit Cycle">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <TextField label="Name" placeholder="e.g. Q3 2026 Asset Audit" error={errors.name?.message} {...register("name")} />
          <TextField label="Start date" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <SelectField label="Auditor" error={errors.auditorId?.message} {...register("auditorId")}>
            <option value="">Select an auditor…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </SelectField>
          <TextField label="Description (optional)" error={errors.description?.message} {...register("description")} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All active (non-retired, non-disposed) assets in your organization will be included in this audit.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Create Audit Cycle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
