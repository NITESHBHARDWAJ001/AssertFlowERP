import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSettings, updateSettings } from "../../api/settings";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/FormField";
import { Toggle } from "../../components/ui/Toggle";
import { ROLE_LABELS } from "../../types/role";

const ROLE_PERMISSIONS: { role: keyof typeof ROLE_LABELS; permissions: string[] }[] = [
  {
    role: "ORG_ADMIN",
    permissions: [
      "Manage departments & employees",
      "Manage asset categories",
      "Register assets",
      "View reports & analytics",
      "Manage audits",
      "Configure organization settings",
    ],
  },
  {
    role: "ASSET_MANAGER",
    permissions: [
      "Register & allocate assets",
      "Approve transfers & maintenance",
      "Manage resource bookings",
      "View asset reports",
      "Track asset lifecycle",
    ],
  },
  {
    role: "DEPARTMENT_HEAD",
    permissions: [
      "View department assets",
      "Approve asset requests & transfers",
      "View department reports",
      "Book shared resources",
    ],
  },
  {
    role: "EMPLOYEE",
    permissions: [
      "View assigned assets",
      "Request assets",
      "Raise maintenance requests",
      "Return assets",
      "Book shared resources",
    ],
  },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  const [name, setName] = useState("");
  const [assetTagPrefix, setAssetTagPrefix] = useState("");
  const [bookingRequiresApproval, setBookingRequiresApproval] = useState(true);
  const [maintenanceRequiresApproval, setMaintenanceRequiresApproval] = useState(true);

  useEffect(() => {
    if (settings) {
      setName(settings.name);
      setAssetTagPrefix(settings.assetTagPrefix);
      setBookingRequiresApproval(settings.bookingRequiresApproval);
      setMaintenanceRequiresApproval(settings.maintenanceRequiresApproval);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to save settings"),
  });

  if (isLoading || !settings) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <TextField label="Organization name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="Asset tag prefix"
            value={assetTagPrefix}
            onChange={(e) => setAssetTagPrefix(e.target.value.toUpperCase())}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            New assets are tagged like{" "}
            <span className="font-mono">{assetTagPrefix || "AST"}-00001</span>. Changing this only affects assets
            registered after saving.
          </p>
          <div className="flex justify-end">
            <Button
              isLoading={updateMutation.isPending}
              onClick={() => updateMutation.mutate({ name, assetTagPrefix })}
            >
              Save
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking & Maintenance Rules</CardTitle>
        </CardHeader>
        <CardBody className="divide-y divide-slate-100 dark:divide-slate-800">
          <Toggle
            label="Bookings require approval"
            description="When off, new resource bookings are approved automatically instead of waiting for a manager."
            checked={bookingRequiresApproval}
            onChange={(checked) => {
              setBookingRequiresApproval(checked);
              updateMutation.mutate({ bookingRequiresApproval: checked });
            }}
          />
          <Toggle
            label="Maintenance requires approval"
            description="When off, new maintenance requests are approved automatically and the asset moves to Maintenance status immediately."
            checked={maintenanceRequiresApproval}
            onChange={(checked) => {
              setMaintenanceRequiresApproval(checked);
              updateMutation.mutate({ maintenanceRequiresApproval: checked });
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {ROLE_PERMISSIONS.map((r) => (
            <div key={r.role}>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ROLE_LABELS[r.role]}</p>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-500 dark:text-slate-400">
                {r.permissions.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
