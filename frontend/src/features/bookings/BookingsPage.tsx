import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { cancelBooking, createBooking, decideBooking, listBookings, rescheduleBooking } from "../../api/bookings";
import { listResources } from "../../api/resources";
import { useAuth } from "../../features/auth/useAuth";
import { Role } from "../../types/role";
import type { Booking } from "../../types/booking";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SelectField, TextField } from "../../components/ui/FormField";
import { BookingStatusBadge } from "../../components/ui/BookingStatusBadge";

const schema = z
  .object({
    resourceId: z.string().min(1, "Resource is required"),
    purpose: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });
type Form = z.infer<typeof schema>;

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay
    ? `${s.toLocaleDateString()} ${s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : `${s.toLocaleString()} – ${e.toLocaleString()}`;
}

export function BookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const canDecide = user?.role === Role.ORG_ADMIN || user?.role === Role.ASSET_MANAGER;

  const { data: bookings = [], isLoading } = useQuery({ queryKey: ["bookings"], queryFn: listBookings });
  const { data: resources = [] } = useQuery({ queryKey: ["resources"], queryFn: listResources });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: Form) =>
      createBooking({
        ...values,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Booking submitted");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create booking"),
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => decideBooking(id, approve),
    onSuccess: () => {
      toast.success("Decision recorded");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to record decision"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to cancel booking"),
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      rescheduleBooking(rescheduleTarget!.id, new Date(newStart).toISOString(), new Date(newEnd).toISOString()),
    onSuccess: () => {
      toast.success("Booking rescheduled");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setRescheduleTarget(null);
      setNewStart("");
      setNewEnd("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to reschedule"),
  });

  const canModify = (booking: Booking) =>
    canDecide || (booking.bookedBy.id === user?.id && booking.status !== "CANCELLED" && booking.status !== "REJECTED");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resource Bookings</h1>
        <Button onClick={() => setIsModalOpen(true)}>New Booking</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">Booked By</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Purpose</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No bookings yet
                    </td>
                  </tr>
                )}
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">{b.resource.name}</td>
                    <td className="px-4 py-3">
                      {b.bookedBy.firstName} {b.bookedBy.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatRange(b.startTime, b.endTime)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{b.purpose ?? "—"}</td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {canDecide && b.status === "PENDING" && (
                          <>
                            <Button size="sm" onClick={() => decideMutation.mutate({ id: b.id, approve: true })}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => decideMutation.mutate({ id: b.id, approve: false })}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {canModify(b) && (b.status === "PENDING" || b.status === "APPROVED") && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setRescheduleTarget(b);
                                setNewStart(b.startTime.slice(0, 16));
                                setNewEnd(b.endTime.slice(0, 16));
                              }}
                            >
                              Reschedule
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => cancelMutation.mutate(b.id)}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Book a Resource">
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
          <SelectField label="Resource" error={errors.resourceId?.message} {...register("resourceId")}>
            <option value="">Select a resource…</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Start time" type="datetime-local" error={errors.startTime?.message} {...register("startTime")} />
            <TextField label="End time" type="datetime-local" error={errors.endTime?.message} {...register("endTime")} />
          </div>
          <TextField label="Purpose (optional)" error={errors.purpose?.message} {...register("purpose")} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Submit Booking
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={rescheduleTarget !== null} onClose={() => setRescheduleTarget(null)} title="Reschedule Booking">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="New start time"
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
            />
            <TextField label="New end time" type="datetime-local" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rescheduling resets the booking to pending approval.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={rescheduleMutation.isPending}
              onClick={() => rescheduleMutation.mutate()}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
