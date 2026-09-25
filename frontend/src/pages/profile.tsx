import {
  CalendarDays,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserLayout } from "@/layouts/UserLayout";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { getMe, updateProfile, changePassword } from "@/services/api";
import { formatDate } from "@/utils/format";

const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

type ProfileForm = {
  name: string;
  phone: string;
  line1: string;
  city: string;
  notes: string;
};

type ProfileSource = {
  name?: string;
  phone?: string;
  address?: { line1?: string; city?: string; notes?: string };
};

const toForm = (user: ProfileSource | null | undefined): ProfileForm => ({
  name: user?.name ?? "",
  phone: user?.phone ?? "",
  line1: user?.address?.line1 ?? "",
  city: user?.address?.city ?? "",
  notes: user?.address?.notes ?? "",
});

function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ProfileForm>(toForm(user));
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getMe().then((res) => {
      if (res.success) updateUser(res.data.user);
    });
  }, []);

  const addressText = [user?.address?.line1, user?.address?.city]
    .filter(Boolean)
    .join(", ");

  const isDirty =
    JSON.stringify({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      city: form.city.trim(),
      notes: form.notes.trim(),
    }) !== JSON.stringify(toForm(user));

  // Edit profile 
  const openEditProfile = () => {
    setForm(toForm(user));
    setErrors({});
    setEditOpen(true);
  };

  const validateProfile = () => {
    const next: Record<string, string> = {};

    if (form.name.trim().length < 2) {
      next["name"] = "Please enter your full name";
    } else if (form.name.trim().length > 80) {
      next["name"] = "Name must be 80 characters or fewer";
    }

    if (form.phone.trim() && !PHONE_REGEX.test(form.phone.trim())) {
      next["phone"] = "Enter a valid phone number, e.g. +92 300 1234567";
    }

    if (form.line1.trim().length > 200) {
      next["line1"] = "Keep the address under 200 characters";
    }
    if (form.city.trim().length > 80) {
      next["city"] = "City must be 80 characters or fewer";
    }
    if (form.notes.trim().length > 200) {
      next["notes"] = "Keep delivery notes under 200 characters";
    }

    return next;
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateProfile();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);

    try {
      const res = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: {
          line1: form.line1.trim(),
          city: form.city.trim(),
          notes: form.notes.trim(),
        },
      });

      if (res.success) {
        updateUser(res.data.user);
        setEditOpen(false);
        toast.success(res.message ?? "Profile updated");
      } else {
        toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const openChangePassword = () => {
    setPasswords({ current: "", next: "", confirm: "" });
    setErrors({});
    setPasswordOpen(true);
  };

  const submitChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (passwords.current.length === 0) {
      nextErrors["current"] = "Enter your current password";
    }
    if (passwords.next.length < 6) {
      nextErrors["next"] = "Use at least 6 characters";
    } else if (passwords.next === passwords.current) {
      nextErrors["next"] = "New password must be different from the current one";
    }
    if (passwords.next !== passwords.confirm) {
      nextErrors["confirm"] = "Passwords do not match";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);

    try {
      const res = await changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
        confirmPassword: passwords.confirm,
      });

      if (res.success) {
        toast.success(res.message ?? "Password changed successfully");
        setPasswordOpen(false);
        setPasswords({ current: "", next: "", confirm: "" });
      } else if (/current password/i.test(res.message)) {
        // Wrong current password belongs on that field; other errors are toasts.
        setErrors({ current: res.message });
      } else {
        toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <UserLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Your Profile</h1>

        <p className="mt-1 text-muted-foreground">
          Manage your PizzaHub account information.
        </p>

        {/* Identity */}
        <section className="card-soft mt-8 p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-primary text-2xl font-extrabold text-primary-foreground">
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </span>

            <div className="min-w-0">
              <p className="truncate text-xl font-bold">
                {user?.name ?? "User"}
              </p>

              <p className="truncate text-sm text-muted-foreground">
                {user?.email ?? "—"}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info icon={User} label="Name" value={user?.name ?? "—"} />
            <Info icon={Mail} label="Email" value={user?.email ?? "—"} />
            <Info
              icon={Phone}
              label="Phone"
              value={user?.phone || "Not added"}
            />
            <Info
              icon={ShieldCheck}
              label="Account"
              value={user?.isVerified ? "Verified customer" : "Email not verified"}
            />
            <Info
              icon={CalendarDays}
              label="Member since"
              value={user?.createdAt ? formatDate(user.createdAt) : "—"}
            />
          </dl>

          <div className="mt-6">
            <Button onClick={openEditProfile}>Edit Profile</Button>
          </div>
        </section>

        {/* Delivery address */}
        <section className="card-soft mt-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Delivery address</h2>
              <p className="text-sm text-muted-foreground">
                Where we bring your pizza.
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={openEditProfile}>
              {addressText ? "Edit" : "Add"}
            </Button>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-muted p-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <div className="min-w-0 text-sm">
              {addressText ? (
                <>
                  <p className="font-semibold">{addressText}</p>
                  {user?.address?.notes && (
                    <p className="mt-1 text-muted-foreground">
                      {user.address.notes}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  No delivery address added yet.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="card-soft mt-6 p-6">
          <h2 className="text-lg font-bold">Security</h2>
          <p className="text-sm text-muted-foreground">
            Keep your account safe with a strong password.
          </p>

          <div className="mt-4">
            <Button variant="outline" onClick={openChangePassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </div>
        </section>
      </div>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your contact details and delivery address.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveProfile} className="space-y-4">
            <FormField
              id="p-name"
              label="Full Name"
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              error={errors["name"]}
              disabled={saving}
            />

            <FormField
              id="p-phone"
              label="Phone"
              value={form.phone}
              onChange={(value) =>
                setForm((current) => ({ ...current, phone: value }))
              }
              placeholder="+92 300 1234567"
              error={errors["phone"]}
              disabled={saving}
            />

            <FormField
              id="p-line1"
              label="Street address"
              value={form.line1}
              onChange={(value) =>
                setForm((current) => ({ ...current, line1: value }))
              }
              placeholder="House / flat, street, area"
              error={errors["line1"]}
              disabled={saving}
            />

            <FormField
              id="p-city"
              label="City"
              value={form.city}
              onChange={(value) =>
                setForm((current) => ({ ...current, city: value }))
              }
              placeholder="Karachi"
              error={errors["city"]}
              disabled={saving}
            />

            <FormField
              id="p-notes"
              label="Delivery notes (optional)"
              value={form.notes}
              onChange={(value) =>
                setForm((current) => ({ ...current, notes: value }))
              }
              placeholder="e.g. Ring the bell twice"
              error={errors["notes"]}
              disabled={saving}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving || !isDirty}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitChangePassword} className="space-y-4">
            <FormField
              id="cur"
              label="Current Password"
              type="password"
              value={passwords.current}
              onChange={(value) =>
                setPasswords((current) => ({ ...current, current: value }))
              }
              error={errors["current"]}
              disabled={saving}
            />

            <FormField
              id="new"
              label="New Password"
              type="password"
              value={passwords.next}
              onChange={(value) =>
                setPasswords((current) => ({ ...current, next: value }))
              }
              error={errors["next"]}
              disabled={saving}
            />

            <FormField
              id="conf"
              label="Confirm Password"
              type="password"
              value={passwords.confirm}
              onChange={(value) =>
                setPasswords((current) => ({ ...current, confirm: value }))
              }
              error={errors["confirm"]}
              disabled={saving}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>

        <dd className="truncate font-semibold">{value}</dd>
      </div>
    </div>
  );
}

export default ProfilePage;