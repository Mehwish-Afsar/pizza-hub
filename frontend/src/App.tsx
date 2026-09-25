import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { PizzaBuilderProvider } from "@/context/PizzaBuilderContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

import { Home } from "@/pages/index";
import { DashboardPage } from "@/pages/dashboard";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { LoginPage } from "@/pages/login";
import { MenuPage } from "@/pages/menu";
import { OrderConfirmationPage } from "@/pages/order-confirmation";
import { OrderSummaryPage } from "@/pages/order-summary";

import BuilderPage from "@/pages/pizza-builder";
import ProfilePage from "@/pages/profile";
import RegisterPage from "@/pages/register";
import ResetPasswordPage from "@/pages/reset-password";
import VerifyEmailPage from "@/pages/verify-email";
import CheckEmailPage from "@/pages/CheckEmailPage";
import OrdersPage from "@/pages/orders.index";
import OrderDetailPage from "@/pages/orders.$id";

import AdminDashboard from "@/pages/admin.index";
import InventoryPage from "@/pages/admin.inventory";
import AdminLoginPage from "@/pages/admin.login";
import AdminOrdersPage from "@/pages/admin.orders";
import AdminSettingsPage from "@/pages/admin.settings";
import AdminPizzasPage from "@/pages/admin.pizzas";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PizzaBuilderProvider>
            <Routes>
              <Route path="/" element={<Home />} />

              <Route path="/dashboard" element={<DashboardPage />} />

              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />

              <Route path="/login" element={<LoginPage />} />

              <Route path="/menu" element={<MenuPage />} />

              {/* <Route
                path="/order-confirmation/:id"
                element={<OrderConfirmationPage />}
              /> */}

              <Route
                path="/order-summary"
                element={<OrderSummaryPage />}
              />

              <Route
                path="/pizza-builder"
                element={<BuilderPage />}
              />

              <Route path="/profile" element={<ProfilePage />} />

              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />

              <Route path="/check-email" element={<CheckEmailPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              <Route path="/admin" element={<AdminDashboard />} />

              <Route
                path="/admin/inventory"
                element={<InventoryPage />}
              />

              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />

              <Route
                path="/admin/pizzas"
                element={<AdminPizzasPage />}
              />

              <Route
                path="/admin/login"
                element={<AdminLoginPage />}
              />

              <Route
                path="/admin/orders"
                element={<AdminOrdersPage />}
              />

              <Route
                path="/admin/settings"
                element={<AdminSettingsPage />}
              />

              <Route path="/orders" element={<OrdersPage />} />

              <Route
                path="/orders/:id"
                element={<OrderDetailPage />}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>



            <Toaster position="top-right" richColors />
          </PizzaBuilderProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}