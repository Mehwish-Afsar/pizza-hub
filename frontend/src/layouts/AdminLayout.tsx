import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Pizza,
  ReceiptText,
  Settings,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/services/api";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/pizzas", label: "Pizzas", icon: Pizza },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { isAdmin, ready, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState(window.location.pathname);

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    getNotifications().then((res) => {
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    });
  };

  useEffect(() => {
    if (!ready || !isAdmin) return;

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // poll every 30s

    return () => clearInterval(interval);
  }, [ready, isAdmin]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openNotifications = () => {
    setNotifOpen((v) => !v);
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read) {
      const res = await markNotificationRead(notification.id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    }
  };

  useEffect(() => {
    if (ready && !isAdmin) {
      toast.error("Admin access only");
      window.location.href = "/admin/login";
    }
  }, [ready, isAdmin]);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };


  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setPathname(path);
    setOpen(false);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  const sidebar = (<div className="flex h-full flex-col bg-sidebar text-sidebar-foreground"> <div className="flex items-center gap-2 px-5 py-5"> <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground"> <Pizza className="h-4 w-4" /> </span>

    <div className="min-w-0">
      <p className="truncate font-extrabold">PizzaHub</p>
      <p className="text-xs opacity-70">Admin console</p>
    </div>
  </div>

    <nav className="flex-1 space-y-1 px-3">
      {navItems.map((item) => {
        const active =
          pathname === item.to ||
          (item.to !== "/admin" && pathname.startsWith(item.to));

        return (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "hover:bg-sidebar-accent"
              }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </nav>

    <button
      type="button"
      onClick={handleLogout}
      className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  </div>

  );

  if (!ready || !isAdmin) {
    return (<div className="min-h-screen space-y-4 p-8"> <Skeleton className="h-10 w-64" /> <Skeleton className="h-64 w-full" /> </div>
    );
  }

  return (<div className="flex min-h-screen bg-background"> <aside className="hidden w-64 shrink-0 lg:block"> <div className="fixed h-screen w-64">{sidebar}</div> </aside>

    {open && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          aria-label="Close menu"
          className="absolute inset-0 bg-ink/50"
          onClick={() => setOpen(false)}
        />

        <div className="absolute left-0 top-0 h-full w-64">
          {sidebar}
        </div>
      </div>
    )}

    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            {open ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>

          <h1 className="truncate text-lg font-bold sm:text-xl">
            {title}
          </h1>
        </div>

                  <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openNotifications}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>

            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between border-b border-border p-3">
                  <p className="text-sm font-bold">Notifications</p>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className={`block w-full border-b border-border p-3 text-left text-sm transition-colors last:border-0 hover:bg-accent ${
                          n.read ? "opacity-60" : ""
                        }`}
                      >
                        <p className="font-semibold">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {n.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
      </header>

      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  </div>

  );
}
