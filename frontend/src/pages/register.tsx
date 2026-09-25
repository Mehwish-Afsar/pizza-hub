import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/forms/AuthShell";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/services/api";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (form.name.trim().length < 2) {
      next["name"] = "Please enter your full name";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next["email"] = "Enter a valid email address";
    }

    if (form.password.length < 8) {
      next["password"] = "Use at least 8 characters";
    }

    if (form.password !== form.confirm) {
      next["confirm"] = "Passwords do not match";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (!res.success) {
        toast.error(res.message || "Registration failed");
        return;
      }

      toast.success("Account created successfully");
      navigate("/check-email", { state: { email: form.email } });
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It only takes a minute to start building."
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Login
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField
          id="name"
          label="Full Name"
          value={form.name}
          onChange={set("name")}
          error={errors["name"]}
          placeholder="Alex Morgan"
          disabled={loading}
        />

        <FormField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={set("email")}
          error={errors["email"]}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          error={errors["password"]}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
        />

        <FormField
          id="confirm"
          label="Confirm Password"
          type="password"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors["confirm"]}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}