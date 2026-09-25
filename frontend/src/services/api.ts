import type { ORDER_STATUS_FLOW, OrderStatus } from "../utils/orderStatus";
import type { Pizza, BuilderOption } from "../utils/pizza";
import type { AdminInventoryItem } from "@/utils/inventory";



const API_BASE =
  import.meta.env["VITE_API_URL"] || "http://localhost:5000/api";

const TOKEN_KEY = "pizzahub_token";

export type ApiResult<T = undefined> =
  | {
      success: true;
      message?: string;
      data: T;
    }
  | {
      success: false;
      message: string;
      data?: undefined;
    };

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// API FETCH
async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
  } = {}
): Promise<ApiResult<T>> {
  const {
    method = "GET",
    body,
    auth = false,
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(
      `${API_BASE}${path}`,
      requestOptions
    );

    const json = await response
      .json()
      .catch(() => ({}));

    if (!response.ok || json.success === false) {
      return {
        success: false,
        message:
          json.message ||
          "Something went wrong. Please try again.",
      };
    }

    const {
      success,
      message,
      ...rest
    } = json;

    return {
      success: true,
      message,
      data: rest as T,
    };
  } catch (error) {
    console.error("API Error:", error);

    return {
      success: false,
      message:
        "Network error. Please check your connection and try again.",
    };
  }
}


// REGISTER
export async function registerUser(
  payload: {
    name: string;
    email: string;
    password: string;
  }
) {
  return apiFetch<{ user: AuthUser }>(
    "/auth/register",
    {
      method: "POST",
      body: payload,
    }
  );
}


// USER LOGIN
export async function loginUser(
  payload: {
    email: string;
    password: string;
  }
) {
  const res =
    await apiFetch<{
      token: string;
      user: AuthUser;
    }>(
      "/auth/login",
      {
        method: "POST",
        body: payload,
      }
    );

  if (res.success) {
    setToken(res.data.token);
  }

  return res;
}

// ADMIN LOGIN
export async function adminLogin(
  payload: {
    email: string;
    password: string;
  }
) {
  const res =
    await apiFetch<{
      token: string;
      user: AuthUser;
    }>(
      "/auth/admin/login",
      {
        method: "POST",
        body: payload,
      }
    );

  if (res.success) {
    setToken(res.data.token);
  }

  return res;
}


// VERIFY EMAIL
export async function verifyEmail(
  token: string
) {
  return apiFetch<undefined>(
    "/auth/verify-email",
    {
      method: "POST",
      body: {
        token,
      },
    }
  );
}


// RESEND VERIFICATION EMAIL
export async function resendVerification(
  email: string
) {
  return apiFetch<undefined>(
    "/auth/resend-verification",
    {
      method: "POST",
      body: {
        email,
      },
    }
  );
}


// FORGOT PASSWORD
export async function forgotPassword(
  email: string
) {
  return apiFetch<undefined>(
    "/auth/forgot-password",
    {
      method: "POST",
      body: {
        email,
      },
    }
  );
}


// RESET PASSWORD
export async function resetPassword(
  payload: {
    token: string;
    password: string;
    confirmPassword?: string;
  }
) {
  return apiFetch<undefined>(
    "/auth/reset-password",
    {
      method: "POST",
      body: payload,
    }
  );
}


// GET CURRENT USER
export async function getMe() {
  return apiFetch<{ user: AuthUser }>(
    "/auth/me",
    {
      method: "GET",
      auth: true,
    }
  );
}

export type UserAddress = { line1: string; city: string; notes: string };

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: UserAddress;
  createdAt?: string;
  role: "user" | "admin";
  isVerified: boolean;
};

// UPDATE PROFILE
export async function updateProfile(
  payload: {
    name: string;
    phone?: string;
    address?: Partial<UserAddress>;
  }
) {
  return apiFetch<{ user: AuthUser }>("/auth/update-profile", {
    method: "PUT",
    body: payload,
    auth: true,
  });
}


// CHANGE PASSWORD
export async function changePassword(
  payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }
) {
  return apiFetch<undefined>(
    "/auth/change-password",
    {
      method: "PUT",
      body: payload,
      auth: true,
    }
  );
}


// LOGOUT
export function logout(): void {
  clearToken();
}

// PIZZA TYPES (raw shape as returned by MongoDB/Mongoose)
export type RawPizza = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  ingredients?: string[];
  isAvailable: boolean;
  [key: string]: unknown;
};

export type InventoryItem = {
  _id: string;
  category: "base" | "sauce" | "cheese" | "vegetable";
  name: string;
  price: number;
  description?: string;
  [key: string]: unknown;
};

export type PizzaOptions = {
  bases: InventoryItem[];
  sauces: InventoryItem[];
  cheeses: InventoryItem[];
  vegetables: InventoryItem[];
};


function normalizePizza(raw: RawPizza): Pizza {
  return {
    id: raw._id,
    name: raw.name,
    description: raw.description ?? "",
    price: raw.price,
    image: raw.image ?? "",
    ingredients: raw.ingredients ?? [],
  };
}

function normalizeInventoryItem(raw: InventoryItem): BuilderOption {
  return {
    id: raw._id,
    name: raw.name,
    price: raw.price,
    description: raw.description ?? "",
  };
}

// GET PIZZAS
export async function getPizzas() {
  const res = await apiFetch<{ count: number; pizzas: RawPizza[] }>(
    "/pizzas"
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: res.data.pizzas.map(normalizePizza),
  };
}

// GET PIZZA BUILDER OPTIONS
export async function getPizzaOptions() {
  const res = await apiFetch<{ options: PizzaOptions }>(
    "/pizzas/options"
  );

  if (!res.success) return res;

  const { options } = res.data;

  return {
    success: true as const,
    message: res.message,
    data: {
      bases: options.bases.map(normalizeInventoryItem),
      sauces: options.sauces.map(normalizeInventoryItem),
      cheeses: options.cheeses.map(normalizeInventoryItem),
      vegetables: options.vegetables.map(normalizeInventoryItem),
    },
  };
}

// GET SINGLE PIZZA
export async function getPizzaById(id: string) {
  const res = await apiFetch<{ pizza: RawPizza }>(`/pizzas/${id}`);

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizePizza(res.data.pizza),
  };
}

// ORDER TYPES
export type RawOrder = {
  _id: string;
  orderType: "custom" | "preset";
  pizza?: {
    base: { id: string; name: string };
    sauce: { id: string; name: string };
    cheese: { id: string; name: string };
    vegetables: { id: string; name: string }[];
  };
  presetPizza?: { id: string; name: string };
  quantity: number;
  amount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  needsAttention?: boolean;
  attentionReason?: string;
  [key: string]: unknown;
};

export type Order = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentStatus: string;
  date: string;
  amount: number;
  quantity: number;
  orderType: "custom" | "preset";
  pizzaName?: string | undefined;
  base?: string | undefined;
  sauce?: string | undefined;
  cheese?: string | undefined;
  vegetables?: string[] | undefined;
};

function normalizeOrder(raw: RawOrder): Order {
  return {
    id: raw._id,
    number: `#${raw._id.slice(-6).toUpperCase()}`,
    status: raw.orderStatus as OrderStatus,
    paymentStatus: raw.paymentStatus,
    date: raw.createdAt,
    amount: raw.amount,
    quantity: raw.quantity,
    orderType: raw.orderType,
    pizzaName: raw.presetPizza?.name,
    base: raw.pizza?.base.name,
    sauce: raw.pizza?.sauce.name,
    cheese: raw.pizza?.cheese.name,
    vegetables: raw.pizza?.vegetables.map((v) => v.name),
  };
}

export async function createOrder(
  payload:
    | { pizzaId: string; quantity: number }
    | {
        baseId: string;
        sauceId: string;
        cheeseId: string;
        vegetableIds: string[];
        quantity: number;
      }
) {
  const res = await apiFetch<{ order: RawOrder }>("/orders", {
    method: "POST",
    body: payload,
    auth: true,
  });

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizeOrder(res.data.order),
  };
}

// GET MY ORDERS
export async function getMyOrders() {
  const res = await apiFetch<{ count: number; orders: RawOrder[] }>(
    "/orders/my-orders",
    { auth: true }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: res.data.orders.map(normalizeOrder),
  };
}

// GET MY ORDER BY ID
export async function getMyOrderById(id: string) {
  const res = await apiFetch<{ order: RawOrder }>(
    `/orders/my-orders/${id}`,
    { auth: true }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizeOrder(res.data.order),
  };
}

// CANCEL ORDER
export async function cancelOrder(id: string) {
  const res = await apiFetch<{ order: RawOrder }>(
    `/orders/${id}/cancel`,
    { method: "PATCH", auth: true }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizeOrder(res.data.order),
  };
}


// INVENTORY TYPES
export type RawInventoryItem = {
  _id: string;
  name: string;
  category: "base" | "sauce" | "cheese" | "vegetable";
  stock: number;
  lowStockThreshold: number;
  price: number;
  [key: string]: unknown;
};

function normalizeAdminInventoryItem(raw: RawInventoryItem): AdminInventoryItem {
  return {
    id: raw._id,
    name: raw.name,
    category: raw.category,
    stock: raw.stock,
    threshold: raw.lowStockThreshold,
    price: raw.price,
  };
}

// GET INVENTORY (admin)
export async function getInventory() {
  const res = await apiFetch<{ count: number; inventory: RawInventoryItem[] }>(
    "/inventory",
    { auth: true }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: res.data.inventory.map(normalizeAdminInventoryItem),
  };
}

// CREATE INVENTORY ITEM (admin)
export async function createInventoryItem(payload: {
  name: string;
  category: "base" | "sauce" | "cheese" | "vegetable";
  stock: number;
  lowStockThreshold: number;
  price: number;
}) {
  const res = await apiFetch<{ item: RawInventoryItem }>("/inventory", {
    method: "POST",
    body: payload,
    auth: true,
  });

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizeAdminInventoryItem(res.data.item),
  };
}

// ADJUST STOCK (relative, e.g. +50 on restock)
export async function adjustInventoryStock(id: string, adjustment: number) {
  const res = await apiFetch<{ item: RawInventoryItem }>(
    `/inventory/${id}/adjust`,
    {
      method: "PATCH",
      body: { adjustment },
      auth: true,
    }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizeAdminInventoryItem(res.data.item),
  };
}

// DELETE INVENTORY ITEM (admin)

export async function deleteInventoryItem(id: string) {
  return apiFetch<undefined>(`/inventory/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// UPDATE INVENTORY (stock + threshold together)
export async function updateInventory(item: {
  id: string;
  stock: number;
  threshold: number;
}) {
  const [stockRes, thresholdRes] = await Promise.all([
    apiFetch<{ item: RawInventoryItem }>(`/inventory/${item.id}/stock`, {
      method: "PATCH",
      body: { stock: item.stock },
      auth: true,
    }),
    apiFetch<{ item: RawInventoryItem }>(`/inventory/${item.id}/threshold`, {
      method: "PATCH",
      body: { threshold: item.threshold },
      auth: true,
    }),
  ]);

  if (!stockRes.success) return stockRes;
  if (!thresholdRes.success) return thresholdRes;

  return {
    success: true as const,
    message: thresholdRes.message,
    data: normalizeAdminInventoryItem(thresholdRes.data.item),
  };
}

// ADMIN DASHBOARD
export type AdminDashboardStats = {
  totalUsers: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  inventoryItems: number;
  lowStockItems: number;
  totalRevenue: number;
};

export type RawAdminOrder = RawOrder & {
  user?: { _id: string; name: string; email: string } | string;
};

export type AdminOrder = Order & {
  needsAttention: boolean;
  attentionReason: string | null;
  customerName: string;
  customerEmail: string;
};

function normalizeAdminOrder(raw: RawAdminOrder): AdminOrder {
  const base = normalizeOrder(raw);
  const user = typeof raw.user === "object" ? raw.user : null;

  return {
    ...base,
    needsAttention: raw.needsAttention === true,
    attentionReason:
      typeof raw.attentionReason === "string" ? raw.attentionReason : null,
    customerName: user?.name ?? "Unknown",
    customerEmail: user?.email ?? "",
  };
}

export async function getAdminDashboard() {
  const res = await apiFetch<{
    stats: AdminDashboardStats;
    recentOrders: RawAdminOrder[];
  }>("/admin/dashboard", { auth: true });

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: {
      stats: res.data.stats,
      recentOrders: res.data.recentOrders.map(normalizeAdminOrder),
    },
  };
}

export async function getAdminLowStock() {
  const res = await apiFetch<{ count: number; items: RawInventoryItem[] }>(
    "/admin/low-stock",
    { auth: true }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: res.data.items.map(normalizeAdminInventoryItem),
  };
}


// ADMIN ORDERS
export async function getAdminOrders() {
  const res = await apiFetch<{ count: number; orders: RawAdminOrder[] }>(
    "/orders/admin/all",
    { auth: true }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: res.data.orders.map(normalizeAdminOrder),
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const res = await apiFetch<{ order: RawAdminOrder }>(
    `/orders/admin/${id}/status`,
    {
      method: "PATCH",
      body: { status },
      auth: true,
    }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizeAdminOrder(res.data.order),
  };
}

// NOTIFICATIONS
export type RawNotification = {
  _id: string;
  type: "LOW_STOCK" | "NEW_ORDER";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  type: "LOW_STOCK" | "NEW_ORDER";
  title: string;
  message: string;
  read: boolean;
  date: string;
};

function normalizeNotification(raw: RawNotification): AppNotification {
  return {
    id: raw._id,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    read: raw.read,
    date: raw.createdAt,
  };
}

export async function getNotifications() {
  const res = await apiFetch<{
    notifications: RawNotification[];
    unreadCount: number;
  }>("/admin/notifications", { auth: true });

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: {
      notifications: res.data.notifications.map(normalizeNotification),
      unreadCount: res.data.unreadCount,
    },
  };
}

export async function markNotificationRead(id: string) {
  return apiFetch<undefined>(`/admin/notifications/${id}/read`, {
    method: "PATCH",
    auth: true,
  });
}

export async function markAllNotificationsRead() {
  return apiFetch<undefined>("/admin/notifications/read-all", {
    method: "PATCH",
    auth: true,
  });
}

// ADMIN PIZZA CRUD
export async function getAllPizzasAdmin() {
  const res = await apiFetch<{ count: number; pizzas: RawPizza[] }>(
    "/pizzas/admin/all",
    { auth: true }
  );

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: res.data.pizzas.map(normalizePizza),
  };
}

export async function createPizza(payload: {
  name: string;
  description: string;
  image?: string;
  ingredients?: string[];
  price: number;
  isAvailable?: boolean;
}) {
  const res = await apiFetch<{ pizza: RawPizza }>("/pizzas/admin", {
    method: "POST",
    body: payload,
    auth: true,
  });

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizePizza(res.data.pizza),
  };
}

export async function updatePizza(
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    image: string;
    ingredients: string[];
    price: number;
    isAvailable: boolean;
  }>
) {
  const res = await apiFetch<{ pizza: RawPizza }>(`/pizzas/admin/${id}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: normalizePizza(res.data.pizza),
  };
}

export async function deletePizza(id: string) {
  return apiFetch<undefined>(`/pizzas/admin/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

// PAYMENT CHECKOUT
export async function createPaymentCheckout(orderId: string) {
  const res = await apiFetch<{
    payment: { checkoutUrl: string; orderId: string };
  }>(`/payments/create/${orderId}`, {
    method: "POST",
    auth: true,
  });

  if (!res.success) return res;

  return {
    success: true as const,
    message: res.message,
    data: res.data.payment,
  };
}

export async function reportPaymentFailed(orderId: string) {
  return apiFetch<{ order: RawOrder }>("/payments/failed", {
    method: "POST",
    body: { orderId },
    auth: true,
  });
}


// ADMIN SETTINGS
export type StoreAlerts = {
  lowStock: boolean;
  newOrder: boolean;
  daily: boolean;
};

export type StoreSettings = {
  storeName: string;
  notificationEmail: string;
  lowStockThreshold: number;
  alerts: StoreAlerts;
};

type RawSettings = StoreSettings & { _id: string; [key: string]: unknown };

export async function getSettings() {
  return apiFetch<{ settings: RawSettings }>("/settings", { auth: true });
}

export async function updateSettings(
  payload: Partial<{
    storeName: string;
    notificationEmail: string;
    lowStockThreshold: number;
    alerts: Partial<StoreAlerts>;
  }>
) {
  return apiFetch<{ settings: RawSettings }>("/settings", {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}



