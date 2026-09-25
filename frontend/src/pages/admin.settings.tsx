import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettings, updateSettings, type StoreAlerts } from "@/services/api";

type AlertKey = keyof StoreAlerts;

const alertOptions: {
  key: AlertKey;
  title: string;
  desc: string;
}[] = [
  {
    key: "lowStock",
    title: "Low stock alerts",
    desc: "Notify when an item falls below its threshold.",
  },
  {
    key: "newOrder",
    title: "New order alerts",
    desc: "Ping the kitchen when an order arrives.",
  },
  {
    key: "daily",
    title: "Daily summary",
    desc: "Send a daily revenue and order recap.",
  },
];

function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [store, setStore] = useState({
    name: "",
    email: "",
    threshold: "20",
  });

  const [alerts, setAlerts] = useState<StoreAlerts>({
    lowStock: true,
    newOrder: true,
    daily: false,
  });

  useEffect(() => {
    getSettings().then((res) => {
      if (res.success) {
        const s = res.data.settings;
        setStore({
          name: s.storeName,
          email: s.notificationEmail,
          threshold: String(s.lowStockThreshold),
        });
        setAlerts(s.alerts);
      } else {
        toast.error(res.message);
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateSettings({
        storeName: store.name.trim(),
        notificationEmail: store.email.trim(),
        lowStockThreshold: Number(store.threshold) || 0,
        alerts,
      });

      if (res.success) {
        toast.success(res.message ?? "Settings updated successfully.");
      } else {
        toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="grid max-w-4xl gap-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="grid max-w-4xl gap-6">
        {/* Store Details */}
        <section className="card-soft p-6">
          <h2 className="text-lg font-bold">Store details</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="store-name">Store name</Label>

              <Input
                id="store-name"
                value={store.name}
                onChange={(e) =>
                  setStore((current) => ({
                    ...current,
                    name: e.target.value,
                  }))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="store-email">Notification email</Label>

              <Input
                id="store-email"
                type="email"
                value={store.email}
                onChange={(e) =>
                  setStore((current) => ({
                    ...current,
                    email: e.target.value,
                  }))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="global-threshold">
                Default low-stock threshold
              </Label>

              <Input
                id="global-threshold"
                type="number"
                min={0}
                value={store.threshold}
                onChange={(e) =>
                  setStore((current) => ({
                    ...current,
                    threshold: e.target.value,
                  }))
                }
                disabled={saving}
              />
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="card-soft p-6">
          <h2 className="text-lg font-bold">Alerts</h2>

          <div className="mt-4 space-y-4">
            {alertOptions.map(({ key, title, desc }) => (
              <div
                key={key}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl bg-muted p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{title}</p>

                  <p className="text-sm text-muted-foreground">
                    {desc}
                  </p>
                </div>

                <Switch
                  checked={alerts[key]}
                  onCheckedChange={(value) =>
                    setAlerts((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Save */}
        <div>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminSettingsPage;