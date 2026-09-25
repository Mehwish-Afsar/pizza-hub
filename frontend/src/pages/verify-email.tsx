import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthShell } from "@/components/forms/AuthShell";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/services/api";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState<string>();
  const hasRun = useRef(false); // guards against StrictMode double-invoke in dev

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    verifyEmail(token).then((res) => {
      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(res.message);
      }
    });
  }, [token]);

  return (
    <AuthShell
      title={
        status === "verifying"
          ? "Verifying your email..."
          : status === "success"
            ? "Email verified"
            : "Verification failed"
      }
      subtitle={
        status === "error"
          ? message ?? "Something went wrong."
          : status === "success"
            ? "You can now log in to your account."
            : "Hang tight while we confirm your account."
      }
      footer={
        <Link to="/login" className="font-semibold text-primary">
          Back to login
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        {status === "verifying" && (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        )}

        {status === "success" && (
          <>
            <span className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-9 w-9" />
            </span>

            <Button asChild className="w-full">
              <Link to="/login">Continue to login</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <span className="grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-9 w-9" />
            </span>

            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to login</Link>
            </Button>
          </>
        )}
      </div>
    </AuthShell>
  );
}