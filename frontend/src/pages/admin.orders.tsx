import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StatusBadge, orderTone, paymentTone } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminOrders, updateOrderStatus, type AdminOrder } from "@/services/api";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/utils/orderStatus";
import { currency, formatDate } from "@/utils/format";

// An order can only move through the kitchen/delivery flow once it is paid.
const isPaid = (order: AdminOrder) => order.paymentStatus === "paid";

// A preset order only has pizzaName; a custom order only has
// base/sauce/cheese/vegetables. This builds a single readable summary
// that works for either shape, instead of assuming one or the other.
const orderSummary = (order: AdminOrder): string => {
  if (order.orderType === "preset") {
    return order.pizzaName ?? "Preset pizza";
  }
  return [order.base, order.sauce, order.cheese].filter(Boolean).join(" · ") || "Custom pizza";
};

function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    getAdminOrders()
      .then((res) => setOrders(res.success ? res.data : []))
      .catch(() => {
        setOrders([]);
        toast.error("Failed to load orders.");
      });
  }, []);

  const changeStatus = async (
    order: AdminOrder,
    status: (typeof ORDER_STATUS_FLOW)[number]
  ) => {
    if (!isPaid(order)) {
      toast.error("This order hasn't been paid yet.");
      return;
    }

    setUpdating(order.id);

    try {
      const res = await updateOrderStatus(order.id, status);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      setOrders((prev) =>
        prev ? prev.map((o) => (o.id === order.id ? res.data : o)) : prev
      );

      setSelected((prev) => (prev && prev.id === order.id ? res.data : prev));

      toast.success(`${order.number} → ${ORDER_STATUS_LABELS[status]}`);
    } catch {
      toast.error("Could not update the order status.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminLayout title="Orders">
      {orders === null ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : orders.length === 0 ? (
        <div className="card-soft p-10 text-center text-muted-foreground">
          No orders yet.
        </div>
      ) : (
        <section className="card-soft overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Pizza</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {orders.map((order) => {
                  const paid = isPaid(order);
                  const locked = order.status === "DELIVERED" || !paid;

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-semibold">
                        {order.number}
                      </TableCell>

                      <TableCell>{order.customerName}</TableCell>

                      <TableCell className="max-w-55 truncate">
                        {orderSummary(order)}
                      </TableCell>

                      <TableCell>{currency(order.amount)}</TableCell>

                      <TableCell>
                        <StatusBadge
                          label={order.paymentStatus}
                          tone={paymentTone(order.paymentStatus)}
                        />
                      </TableCell>

                      <TableCell>
                        {order.status === "CANCELLED" ? (
                          <StatusBadge
                            label={ORDER_STATUS_LABELS.CANCELLED}
                            tone={orderTone("CANCELLED")}
                          />
                        ) : !paid ? (
                          // Unpaid orders are not real orders yet: no kitchen flow.
                          <span className="text-sm text-muted-foreground">
                            Awaiting payment
                          </span>
                        ) : (
                          <Select
                            value={order.status}
                            disabled={locked || updating === order.id}
                            onValueChange={(value) =>
                              changeStatus(
                                order,
                                value as (typeof ORDER_STATUS_FLOW)[number]
                              )
                            }
                          >
                            <SelectTrigger className="w-42.5">
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              {ORDER_STATUS_FLOW.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {ORDER_STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDate(order.date)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(order)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {selected?.number}</DialogTitle>
            <DialogDescription>
              Full order breakdown and status control.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <Detail label="Customer" value={selected.customerName} />
                <Detail label="Amount" value={currency(selected.amount)} />

                {selected.orderType === "preset" ? (
                  <Detail label="Pizza" value={selected.pizzaName ?? "Preset pizza"} />
                ) : (
                  <>
                    <Detail label="Base" value={selected.base ?? "—"} />
                    <Detail label="Sauce" value={selected.sauce ?? "—"} />
                    <Detail label="Cheese" value={selected.cheese ?? "—"} />
                    <Detail
                      label="Vegetables"
                      value={selected.vegetables?.join(", ") || "None"}
                    />
                  </>
                )}
              </dl>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={selected.paymentStatus}
                  tone={paymentTone(selected.paymentStatus)}
                />
                {isPaid(selected) && (
                  <StatusBadge
                    label={ORDER_STATUS_LABELS[selected.status]}
                    tone={orderTone(selected.status)}
                  />
                )}
              </div>

              {!isPaid(selected) && selected.status !== "CANCELLED" && (
                <p className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
                  This order hasn't been paid yet, so its status can't be
                  changed.
                </p>
              )}

              {isPaid(selected) &&
                selected.status !== "DELIVERED" &&
                selected.status !== "CANCELLED" && (
                  <div>
                    <p className="mb-2 text-sm font-semibold">Update status</p>

                    <div className="flex flex-wrap gap-2">
                      {ORDER_STATUS_FLOW.map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={
                            selected.status === status ? "default" : "outline"
                          }
                          disabled={updating === selected.id}
                          onClick={() => changeStatus(selected, status)}
                        >
                          {ORDER_STATUS_LABELS[status]}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted p-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate font-semibold">{value}</dd>
    </div>
  );
}

export default AdminOrdersPage;