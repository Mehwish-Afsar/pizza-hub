import { Link, useSearchParams } from "react-router-dom";
import { StatusBadge, paymentTone } from "@/components/common/StatusBadge";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { UserLayout } from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyOrderById, type Order } from "@/services/api";
import { currency } from "@/utils/format";
import { usePizzaBuilder } from "@/context/PizzaBuilderContext";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 10; // 30 seconds

export function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [gaveUpPolling, setGaveUpPolling] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;

    const load = async () => {
      try {
        const res = await getMyOrderById(orderId);
        if (cancelled) return;

        const data = res.success ? res.data : null;
        setOrder(data);
        setError(false);
        setLoading(false);

        if (data?.paymentStatus === "pending") {
          if (polls++ < MAX_POLLS) {
            timer = setTimeout(load, POLL_INTERVAL_MS);
          } else {
            setGaveUpPolling(true);
          }
        }
      } catch {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  const isPaid = order?.paymentStatus === "paid";

  const builder = usePizzaBuilder();
  useEffect(() => {
    if (isPaid) builder.reset();
  }, [isPaid]);

  const isConfirming = !!order && order.paymentStatus === "pending" && !gaveUpPolling;
  const notConfirmed = !!order && !isPaid && !isConfirming;

  if (!loading && (!orderId || status === "not_found" || error || !order)) {
    return (
      <UserLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="card-soft flex flex-col items-center gap-4 p-10 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-10 w-10" />
            </span>

            <h1 className="text-2xl font-extrabold">
              {error ? "Something went wrong" : "Order not found"}
            </h1>

            <p className="text-muted-foreground">
              {error
                ? "We couldn't load your order. Please check your orders page."
                : "We couldn't find the order for this confirmation link."}
            </p>

            <Button asChild className="mt-2">
              <Link to="/orders">View your orders</Link>
            </Button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="card-soft flex flex-col items-center gap-4 p-10 text-center">
          {/* Icon */}
          {isConfirming || loading ? (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-muted text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin" />
            </span>
          ) : isPaid ? (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-10 w-10" />
            </span>
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-10 w-10" />
            </span>
          )}

          {/* Heading + message */}
          {loading || isConfirming ? (
            <>
              <h1 className="text-3xl font-extrabold">Confirming your payment…</h1>
              <p className="text-muted-foreground">
                This usually takes a few seconds. Please don't close this page.
              </p>
            </>
          ) : isPaid ? (
            <>
              <h1 className="text-3xl font-extrabold">🎉 Order Confirmed!</h1>
              <p className="text-muted-foreground">Your pizza is being prepared.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold">Payment not confirmed</h1>
              <p className="text-muted-foreground">
                We haven't received confirmation of your payment yet. If you were charged,
                it will update shortly. Otherwise you can retry from your order page.
              </p>
            </>
          )}

          {/* Details */}
          {loading ? (
            <Skeleton className="mt-4 h-32 w-full rounded-2xl" />
          ) : (
            <div className="mt-4 w-full space-y-3 rounded-2xl bg-muted p-5 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order</span>
                <span className="font-bold">{order?.number ?? "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <StatusBadge
                  label={order?.paymentStatus ?? "pending"}
                  tone={paymentTone(order?.paymentStatus ?? "pending")}
                />
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">{order ? currency(order.amount) : "—"}</span>
              </div>

              {isPaid && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated delivery</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <Clock className="h-4 w-4" />
                    30–45 minutes
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row">
            {order ? (
              <Button asChild className="flex-1">
                <Link to={`/orders/${order.id}`}>
                  {notConfirmed ? "View order / retry payment" : "Track Your Order"}
                </Link>
              </Button>
            ) : (
              <Button className="flex-1" disabled>
                Track Your Order
              </Button>
            )}

            <Button asChild variant="outline" className="flex-1">
              <Link to="/menu">Order more</Link>
            </Button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}