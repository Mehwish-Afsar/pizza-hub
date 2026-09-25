import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AuthShell } from "@/components/forms/AuthShell";
import { Button } from "@/components/ui/button";
import { resendVerification } from "@/services/api";

function CheckEmailPage() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const resend = async () => {
    if (!email) {
      toast.error("We don't have your email address — please log in to resend verification.");
      return;
    }

    setLoading(true);

    try {
      const res = await resendVerification(email);

      if (!res.success) {
        toast.error(res.message || "Failed to send verification email");
        return;
      }

      toast.success("Verification email sent");
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Check Your Email"
      subtitle="We've sent a verification link to your email address."
      footer={
        <a href="/login" className="font-semibold text-primary">
          Back to login
        </a>
      }
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-accent text-primary">
          <MailCheck className="h-10 w-10" />
        </span>

        <p className="text-sm text-muted-foreground">
          Click the link in the email to activate your account. Didn't get it?
          Check spam or resend below.
        </p>

        <Button className="w-full" onClick={resend} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Sending..." : "Resend verification"}
        </Button>

        <Button asChild variant="ghost" className="w-full">
          <a href="/login">Back to login</a>
        </Button>
      </div>
    </AuthShell>
  );
}

export default CheckEmailPage;