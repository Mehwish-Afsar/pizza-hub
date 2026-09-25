import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/forms/AuthShell";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/services/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setError(undefined);
    setLoading(true);

    const res = await forgotPassword(email);

    setLoading(false);

    if (res.success) {
      setSent(true);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <AuthShell
      title={sent ? "Reset link sent" : "Forgot password?"}
      subtitle={
        sent
          ? "Follow the link in your inbox to set a new password."
          : "We'll email you a reset link."
      }
      footer={
        <Link to="/login" className="font-semibold text-primary">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-9 w-9" />
          </span>

          <p className="text-sm text-muted-foreground">
            If an account exists for <strong>{email}</strong>, a reset link is
            on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={error}
            placeholder="you@example.com"
            disabled={loading}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}