require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const pizzaRoutes = require("./routes/pizza.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");
const settingsRoutes = require("./routes/setting.routes");
const notificationRoutes = require("./routes/notification.routes");
const cronRoutes = require("./routes/cron.routes");
const { startInventoryJob } = require("./jobs/inventory.job");
const { verifyEmailConnection } = require("./services/email.service");

const app = express();

connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:8080",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health checks
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pizza Delivery API is running 🍕",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pizza Delivery API is healthy.",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/pizzas", pizzaRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/notifications", notificationRoutes);
app.use("/api/cron", cronRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("❌ Server Error:", error);

  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || {});
    return res.status(409).json({
      success: false,
      message: `${fields.join(", ")} already exists.`,
    });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation error.",
      errors: messages,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format.",
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error.",
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
});

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log("========================================");
    console.log("🍕 Pizza Delivery API");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("========================================");
  });

  verifyEmailConnection();
  startInventoryJob();

  function shutdown(signal) {
    console.log(`${signal} received. Shutting down...`);
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

module.exports = app;