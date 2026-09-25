import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { UserLayout } from "@/layouts/UserLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge, orderTone, paymentTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyOrders, type Order } from "@/services/api";
import { currency, formatDate } from "@/utils/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    getMyOrders().then((res) => {
      setOrders(res.success ? res.data : []);
    });
  }, []);

  return (
    <UserLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Your Orders
        </h1>

        <p className="mt-1 text-muted-foreground">
          Every pizza you've ordered from PizzaHub.
        </p>

        {orders === null ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="When you place your first order it will show up here."
              action={
                <Button asChild className="mt-2">
                  <Link to="/pizza-builder">Build Your Pizza</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="card-soft card-hover p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-extrabold">
                        {order.number}
                      </span>

                      <StatusBadge
                        label={order.status}
                        tone={orderTone(order.status)}
                      />

                      <StatusBadge
                        label={order.paymentStatus}
                        tone={paymentTone(order.paymentStatus)}
                      />
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(order.date)}
                    </p>

                    <p className="mt-2 truncate text-sm">
                      {order.orderType === "preset"
                        ? order.pizzaName
                        : `${order.base} base · ${order.sauce} sauce · ${order.cheese}${order.vegetables && order.vegetables.length > 0
                          ? ` · ${order.vegetables.join(", ")}`
                          : ""
                        }`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xl font-extrabold text-primary">
                      {currency(order.amount)}
                    </span>

                    <Button asChild variant="outline">
                      <Link to={`/orders/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}