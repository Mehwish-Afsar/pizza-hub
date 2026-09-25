import { AlertTriangle, CheckCircle2, Clock, DollarSign, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge, orderTone, paymentTone } from "@/components/common/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminDashboard,
  getAdminLowStock,
  type AdminDashboardStats,
  type AdminOrder,
} from "@/services/api";
import { stockStatus, type AdminInventoryItem } from "@/utils/inventory";
import { currency, formatDate } from "@/utils/format";

function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[] | null>(null);
  const [lowStock, setLowStock] = useState<AdminInventoryItem[] | null>(null);

  useEffect(() => {
    getAdminDashboard().then((res) => {
      if (res.success) {
        setStats(res.data.stats);
        setRecentOrders(res.data.recentOrders);
      } else {
        setRecentOrders([]);
      }
    });

    getAdminLowStock().then((res) => setLowStock(res.success ? res.data : []));
  }, []);

  const loading = stats === null || recentOrders === null;

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))
          : stats && (
              <>
                <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} tone="primary" />
                <StatCard icon={Clock} label="Pending Orders" value={stats.pendingOrders} tone="secondary" />
                <StatCard icon={CheckCircle2} label="Delivered Orders" value={stats.deliveredOrders} tone="success" />
                <StatCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStockItems} tone="secondary" />
                <StatCard icon={DollarSign} label="Total Revenue" value={currency(stats.totalRevenue)} tone="ink" />
              </>
            )}
      </div>

      {lowStock !== null && lowStock.length > 0 && (
        <section className="card-soft mt-6 border-secondary/60 bg-secondary/10 p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Low Stock
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl bg-card p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <p className="truncate font-semibold">{item.name}</p>
                  <StatusBadge
                    label={stockStatus(item)}
                    tone={item.stock === 0 ? "error" : "warning"}
                  />
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Current stock: {item.stock} · Threshold: {item.threshold}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card-soft mt-6 overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-5">
          <h2 className="truncate text-lg font-bold">Recent Orders</h2>

          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/orders">View all</Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recentOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold">{order.number}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{currency(order.amount)}</TableCell>

                    <TableCell>
                      <StatusBadge label={order.paymentStatus} tone={paymentTone(order.paymentStatus)} />
                    </TableCell>

                    <TableCell>
                      <StatusBadge label={order.status} tone={orderTone(order.status)} />
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {formatDate(order.date)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/orders">Manage</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminDashboard;