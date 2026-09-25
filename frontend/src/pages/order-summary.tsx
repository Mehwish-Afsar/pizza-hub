import { Link } from "react-router-dom";
import { createOrder, createPaymentCheckout } from "@/services/api";
import {
  AlertTriangle,
  Loader2,
  Minus,
  Pencil,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { UserLayout } from "@/layouts/UserLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePizzaBuilder } from "@/context/PizzaBuilderContext";
import { currency } from "@/utils/format";

type PaymentState = "idle" | "processing" | "failed";

export function OrderSummaryPage() {
  const builder = usePizzaBuilder();

  const [payment, setPayment] = useState<PaymentState>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const changeQuantity = (next: number) => {
    setPendingOrderId(null);
    builder.setQuantity(next);
  };

  const checkout = async () => {
    setConfirmOpen(false);
    setPayment("processing");

    try {
      let orderId = pendingOrderId;

      if (!orderId) {
        const orderRes = await createOrder({
          baseId: builder.base!.id,
          sauceId: builder.sauce!.id,
          cheeseId: builder.cheese!.id,
          vegetableIds: builder.veggies.map((v) => v.id),
          quantity: builder.quantity,
        });

        if (!orderRes.success) {
          setPayment("failed");
          toast.error(orderRes.message);
          return;
        }

        orderId = orderRes.data.id;
        setPendingOrderId(orderId);
      }

      const checkoutRes = await createPaymentCheckout(orderId);

      if (!checkoutRes.success) {
        setPayment("failed");
        toast.error(checkoutRes.message);
        return;
      }

      window.location.href = checkoutRes.data.checkoutUrl;
    } catch {
      setPayment("failed");
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (!builder.isComplete) {
    return (
      <UserLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={AlertTriangle}
            title="No pizza to review yet"
            description="Head to the builder and pick a base, sauce and cheese to see your summary here."
            action={
              <Button asChild className="mt-2">
                <Link to="/pizza-builder">Build Your Pizza</Link>
              </Button>
            }
          />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
        <section className="card-soft p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h1 className="truncate text-2xl font-extrabold">Your Pizza</h1>

            <Button asChild variant="outline" size="sm">
              <Link to="/pizza-builder">
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          </div>

          <dl className="mt-6 space-y-4">
            <Line
              label="Base"
              value={builder.base?.name ?? "—"}
              price={builder.subtotals.base}
            />

            <Line
              label="Sauce"
              value={builder.sauce?.name ?? "—"}
              price={builder.subtotals.sauce}
            />

            <Line
              label="Cheese"
              value={builder.cheese?.name ?? "—"}
              price={builder.subtotals.cheese}
            />

            <Line
              label="Vegetables"
              value={
                builder.veggies.length
                  ? builder.veggies.map((v) => v.name).join(", ")
                  : "None"
              }
              price={builder.subtotals.veggies}
            />
          </dl>

          <div className="mt-6 flex items-center gap-4 border-t border-border pt-6">
            <span className="text-sm font-semibold">Quantity</span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={payment === "processing"}
                onClick={() => changeQuantity(builder.quantity - 1)}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <span className="w-8 text-center font-bold">
                {builder.quantity}
              </span>

              <Button
                variant="outline"
                size="icon"
                disabled={payment === "processing"}
                onClick={() => changeQuantity(builder.quantity + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <aside className="card-soft h-fit p-6">
          <h2 className="text-lg font-bold">Checkout</h2>

          <div className="mt-4 space-y-2 text-sm">
            <SmallRow
              label="Pizza subtotal"
              value={currency(builder.unitPrice)}
            />

            <SmallRow
              label={`Quantity × ${builder.quantity}`}
              value={currency(builder.total)}
            />

            <SmallRow label="Delivery" value="Free" />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xl font-extrabold">
            <span>Total</span>

            <span className="text-primary">{currency(builder.total)}</span>
          </div>

          {payment === "failed" ? (
            <div className="mt-6 rounded-2xl bg-destructive/10 p-4 text-destructive">
              <p className="text-sm font-semibold">
                Payment failed. Please try again.
              </p>

              <Button className="mt-3 w-full" onClick={checkout}>
                Retry payment
              </Button>
            </div>
          ) : (
            <Button
              className="mt-6 w-full"
              size="lg"
              disabled={payment === "processing"}
              onClick={() => setConfirmOpen(true)}
            >
              {payment === "processing" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {payment === "processing" ? "Redirecting to payment..." : "Checkout"}
            </Button>
          )}

          <p className="mt-3 text-center text-xs text-muted-foreground">
            You'll be redirected to Safepay to complete your payment securely.
          </p>
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Place this order?</AlertDialogTitle>

            <AlertDialogDescription>
              You're about to pay {currency(builder.total)} for{" "}
              {builder.quantity} custom pizza
              {builder.quantity > 1 ? "s" : ""}. You'll be taken to Safepay to
              complete the payment.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={checkout}>
              Confirm & Pay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UserLayout>
  );
}

function Line({
  label,
  value,
  price,
}: {
  label: string;
  value: string;
  price: number;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border pb-3 last:border-0">
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>

        <dd className="font-semibold">{value}</dd>
      </div>

      <span className="shrink-0 font-semibold">{currency(price)}</span>
    </div>
  );
}

function SmallRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>

      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}