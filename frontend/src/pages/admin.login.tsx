import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AuthShell } from "@/components/forms/AuthShell";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { adminLogin } from "@/services/api";

type AdminLoginErrors = {
  email?: string;
  password?: string;
};

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<AdminLoginErrors>({});

  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: AdminLoginErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      next.email = "Enter a valid email address";
    }

    if (password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }

    setErrors(next);

    if (Object.keys(next).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const res = await adminLogin({
        email,
        password,
      });

      if (!res.success) {
        toast.error(res.message || "Invalid admin credentials");
        return;
      }

      login(res.data.user);

      toast.success("Signed in to admin console");

      navigate("/admin");
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Admin Login"
      subtitle="Admin access only. Authentication is handled by your backend."
      footer={
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Restricted area
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField
          id="a-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          placeholder="admin@pizzahub.com"
          disabled={loading}
        />

        <FormField
          id="a-password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          placeholder="••••••••"
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

          {loading ? "Signing in..." : "Admin Login"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default AdminLoginPage;