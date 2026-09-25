import { useState } from "react";
import type { MouseEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CreditCard, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createPaymentCheckout } from "@/services/api";

/** An order can be paid only while payment is pending and it isn't cancelled. */
export function canPay(order: { paymentStatus: string; status?: string }) {
  return order.paymentStatus === "pending" && order.status !== "CANCELLED";
}

type PayNowButtonProps = {
  orderId: string;
  label?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  className?: string;
};

/**
 * Creates a fresh Safepay checkout for an EXISTING unpaid order and sends the
 * user to Safepay. Safe to place inside a clickable card/link: it stops the
 * click from also opening the order.
 */
export function PayNowButton({
  orderId,
  label = "Pay now",
  size = "default",
  variant = "default",
  className,
}: PayNowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      const res = await createPaymentCheckout(orderId);

      if (!res.success) {
        toast.error(res.message);
        setLoading(false);
        return;
      }

      // Full navigation to Safepay's hosted checkout page.
      window.location.href = res.data.checkoutUrl;
    } catch {
      toast.error("Could not start the payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 h-4 w-4" />
      )}
      {loading ? "Redirecting..." : label}
    </Button>
  );
}

const NOTICES: Record<string, { tone: "warn" | "info"; text: string }> = {
  cancelled: {
    tone: "info",
    text: "Payment was cancelled. You can pay whenever you're ready.",
  },
  unconfirmed: {
    tone: "warn",
    text: "We couldn't confirm your payment yet. If you were charged it should update shortly; otherwise you can try again.",
  },
  invalid_signature: {
    tone: "warn",
    text: "We couldn't verify this payment. Please try again or contact support if you were charged.",
  },
  error: {
    tone: "warn",
    text: "Something went wrong while processing your payment. Please try again.",
  },
};

/** Shows a message based on the ?payment= value the backend redirects with. */
export function PaymentNotice() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get("payment");
  const notice = key ? NOTICES[key] : undefined;

  if (!notice) return null;

  const isWarn = notice.tone === "warn";

  return (
    <div
      role="status"
      className={
        "flex items-start gap-3 rounded-2xl p-4 text-sm " +
        (isWarn
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-foreground")
      }
    >
      {isWarn ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="font-medium">{notice.text}</p>
    </div>
  );
}