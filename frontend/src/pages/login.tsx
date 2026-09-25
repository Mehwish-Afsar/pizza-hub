import { Link, useNavigate } from "react-router-dom";

import { Loader2 } from "lucide-react";

import { useState } from "react";

import { toast } from "sonner";

import { AuthShell } from "@/components/forms/AuthShell";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/services/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const next: Record<string, string> = {};

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      next["email"] = "Enter a valid email address";
    }

    if (password.length < 6) {
      next["password"] = "Password must be at least 6 characters";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    const res = await loginUser({ email, password });

    setLoading(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    login(res.data.user);

    toast.success("Welcome back!");

    navigate("/dashboard");
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to order your next pizza."
      footer={
        <span>
          New to PizzaHub?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary"
          >
            Create Account
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors["email"]}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors["password"]}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(Boolean(v))}
            />

            <Label
              htmlFor="remember"
              className="text-sm font-normal"
            >
              Remember me
            </Label>
          </div>

          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}

          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthShell>
  );
}