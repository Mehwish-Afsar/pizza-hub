import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Pizza as PizzaIcon,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";

import { UserLayout } from "@/layouts/UserLayout";
import { StatCard } from "@/components/common/StatCard";
import { OrderTracker } from "@/components/orders/OrderTracker";
import { PizzaCard } from "@/components/pizza/PizzaCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { currency } from "@/utils/format";
import { getMyOrders, getPizzas, type Order } from "@/services/api";
import type { Pizza } from "@/utils/pizza";

const ACTIVE_STATUSES = ["ORDER_RECEIVED", "IN_KITCHEN", "SENT_TO_DELIVERY"];

export function DashboardPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [pizzas, setPizzas] = useState<Pizza[] | null>(null);

  useEffect(() => {
    getMyOrders().then((res) => setOrders(res.success ? res.data : []));
    getPizzas().then((res) => setPizzas(res.success ? res.data : []));
  }, []);

  const loading = orders === null || pizzas === null;

  const stats = orders
    ? {
        totalOrders: orders.length,
        activeOrders: orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
          .length,
        completedOrders: orders.filter((o) => o.status === "DELIVERED")
          .length,
      }
    : null;

  const activeOrder = orders?.find((o) =>
    ACTIVE_STATUSES.includes(o.status)
  );

  return (
    <UserLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Welcome back, {user?.name ?? "friend"}!
        </h1>

        <p className="mt-1 text-muted-foreground">
          Here's what's cooking today.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading || !stats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))
          ) : (
            <>
              <StatCard
                icon={ShoppingBag}
                label="Total Orders"
                value={stats.totalOrders}
                tone="primary"
              />

              <StatCard
                icon={Clock}
                label="Active Order"
                value={stats.activeOrders}
                tone="secondary"
                hint="In kitchen now"
              />

              <StatCard
                icon={CheckCircle2}
                label="Completed Orders"
                value={stats.completedOrders}
                tone="success"
              />

              <StatCard
                icon={PizzaIcon}
                label="Available Pizzas"
                value={pizzas?.length ?? 0}
                tone="ink"
              />
            </>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="grid gap-2 sm:flex sm:items-end sm:justify-between">
              <h2 className="text-2xl font-extrabold">Available Pizzas</h2>

              <Button asChild variant="ghost">
                <Link to="/menu">Full menu</Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 w-full rounded-2xl" />
                  ))
                : pizzas!
                    .slice(0, 4)
                    .map((pizza) => (
                      <PizzaCard key={pizza.id} pizza={pizza} />
                    ))}
            </div>
          </section>

          <aside className="card-soft h-fit p-6">
            <h2 className="text-lg font-bold">Current Order</h2>

            {loading ? (
              <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
            ) : activeOrder ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  Order {activeOrder.number} ·{" "}
                  {currency(activeOrder.amount)}
                </p>

                <div className="mt-5">
                  <OrderTracker status={activeOrder.status} />
                </div>

                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link to={`/orders/${activeOrder.id}`}>
                    View order details
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  No active orders right now.
                </p>

                <Button asChild className="mt-6 w-full">
                  <Link to="/pizza-builder">Build Your Pizza</Link>
                </Button>
              </>
            )}
          </aside>
        </div>
      </div>
    </UserLayout>
  );
}