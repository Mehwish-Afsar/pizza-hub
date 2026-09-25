import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, SearchX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { UserLayout } from "@/layouts/UserLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  StatusBadge,
  orderTone,
  paymentTone,
} from "@/components/common/StatusBadge";
import {
  PayNowButton,
  PaymentNotice,
  canPay,
} from "@/pages/Paynowbutton";
import { getMyOrderById, type Order } from "@/services/api";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/utils/orderStatus";
import { currency, formatDate } from "@/utils/format";

const POLL_INTERVAL_MS = 8000;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const paymentParam = searchParams.get("payment");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getMyOrderById(id);
      setOrder(res.success ? res.data : null);
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Couldn't refresh order details. Please check your connection.");
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const isPaid = order?.paymentStatus === "paid";
  const isFinal = order?.status === "DELIVERED" || order?.status === "CANCELLED";

  const shouldPoll =
    !!order &&
    !isFinal &&
    (isPaid ||
      (order.paymentStatus === "pending" && paymentParam === "unconfirmed"));

  useEffect(() => {
    if (!shouldPoll) return;
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [shouldPoll, load]);

  if (loading) {
    return (
      <UserLayout>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Skeleton className="mb-6 h-8 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-4 h-5 w-40" />

          <div className="mt-8 space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!order) {
    return (
      <UserLayout>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold">Order not found</h1>

          <p className="mt-2 text-muted-foreground">
            We couldn't find the order you're looking for.
          </p>

          <Button asChild className="mt-6">
            <Link to="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </UserLayout>
    );
  }

  const cancelled = order.status === "CANCELLED";
  const awaitingPayment = canPay(order);

  return (
    <UserLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Button asChild variant="ghost" className="mb-6 -ml-2">
          <Link to="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Order {order.number}</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(order.date)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {cancelled ? (
              <StatusBadge
                label={ORDER_STATUS_LABELS.CANCELLED}
                tone={orderTone("CANCELLED")}
              />
            ) : isPaid ? (
              <StatusBadge
                label={ORDER_STATUS_LABELS[order.status]}
                tone={orderTone(order.status)}
              />
            ) : (
              <StatusBadge
                label="Awaiting payment"
                tone={paymentTone("pending")}
              />
            )}

            <StatusBadge
              label={order.paymentStatus}
              tone={paymentTone(order.paymentStatus)}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <PaymentNotice />

          {awaitingPayment && (
            <section className="card-soft flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Payment pending</p>
                <p className="text-sm text-muted-foreground">
                  Complete your payment to send this order to the kitchen.
                </p>
              </div>

              <PayNowButton orderId={order.id} />
            </section>
          )}

          {isPaid && !cancelled && (
            <section className="card-soft p-6">
              <h2 className="text-lg font-bold">Order Progress</h2>
              <StatusTracker status={order.status} />
            </section>
          )}

          <section className="card-soft p-6">
            <h2 className="text-lg font-bold">Pizza Details</h2>

            {order.orderType === "preset" ? (
              <div className="mt-5 flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Pizza</span>
                <span className="font-medium">{order.pizzaName}</span>
              </div>
            ) : (
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Base</span>
                  <span className="font-medium">{order.base}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Sauce</span>
                  <span className="font-medium">{order.sauce}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Cheese</span>
                  <span className="font-medium">{order.cheese}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Vegetables</span>
                  <span className="text-right font-medium">
                    {order.vegetables && order.vegetables.length > 0
                      ? order.vegetables.join(", ")
                      : "None"}
                  </span>
                </div>
              </div>
            )}

            {order.quantity > 1 && (
              <div className="mt-3 flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">{order.quantity}</span>
              </div>
            )}
          </section>

          <section className="card-soft p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">Order Total</h2>

              <span className="text-2xl font-extrabold text-primary">
                {currency(order.amount)}
              </span>
            </div>
          </section>
        </div>
      </div>
    </UserLayout>
  );
}

function StatusTracker({ status }: { status: Order["status"] }) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    status as (typeof ORDER_STATUS_FLOW)[number]
  );

  return (
    <ol className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:items-start sm:justify-between">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;

        return (
          <li
            key={step}
            className="flex flex-col items-center gap-2 text-center sm:flex-1"
          >
            <span
              className={
                "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold " +
                (done
                  ? "border-success bg-success text-white"
                  : active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground")
              }
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>

            <span
              className={
                "text-xs font-semibold " +
                (active ? "text-foreground" : "text-muted-foreground")
              }
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}