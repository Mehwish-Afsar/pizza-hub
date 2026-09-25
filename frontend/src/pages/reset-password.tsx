import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { AuthShell } from "@/components/forms/AuthShell";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/services/api";
import { passwordStrength } from "@/utils/format";

const barColors = [
  "bg-border",
  "bg-destructive",
  "bg-secondary",
  "bg-secondary",
  "bg-success",
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = passwordStrength(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Record<string, string> = {};

    if (!token) {
      next["password"] = "This reset link is invalid or missing a token.";
    }

    if (password.length < 8) {
      next["password"] = "Use at least 8 characters";
    }

    if (password !== confirm) {
      next["confirm"] = "Passwords do not match";
    }

    setErrors(next);

    if (Object.keys(next).length > 0) return;

    setLoading(true);

    try {
      const res = await resetPassword({ token, password, confirmPassword: confirm });

      if (!res.success) {
        setErrors({ password: res.message || "Unable to reset password" });
        return;
      }

      setDone(true);
    } catch (error) {
      console.error(error);
      setErrors({ password: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={done ? "Password updated" : "Set a new password"}
      subtitle={
        done
          ? "You can now log in with your new password."
          : "Choose a strong password you'll remember."
      }
      footer={
        <Link to="/login" className="font-semibold text-primary">
          Back to login
        </Link>
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-9 w-9" />
          </span>

          <Button asChild className="w-full">
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            id="password"
            label="New Password"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors["password"]}
            placeholder="••••••••"
            disabled={loading}
          />

          <div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < strength.score ? barColors[strength.score] : "bg-border"
                  }`}
                />
              ))}
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground">
              Strength: {strength.label}
            </p>
          </div>

          <FormField
            id="confirm"
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            error={errors["confirm"]}
            placeholder="••••••••"
            disabled={loading}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}