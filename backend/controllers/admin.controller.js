const User = require("../models/User");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");

// GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOrders,
      paidOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      inventoryItems,
      lowStockItems,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "paid" }),
      Order.countDocuments({ paymentStatus: "pending" }),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
      Order.countDocuments({ orderStatus: "CANCELLED" }),
      Inventory.countDocuments(),
      Inventory.countDocuments({ $expr: { $lte: ["$stock", "$lowStockThreshold"] } }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
      ]),
      Order.find().populate("user", "name email").sort({ createdAt: -1 }).limit(10),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        paidOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        inventoryItems,
        lowStockItems,
        totalRevenue,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/order-stats
const getOrderStats = async (req, res, next) => {
  try {
    const statusStats = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    const paymentStats = await Order.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({ success: true, statusStats, paymentStats });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/revenue — revenue grouped by day
const getRevenueStats = async (req, res, next) => {
  try {
    const revenue = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({ success: true, revenue });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/inventory-summary — grouped by base/sauce/cheese/vegetable
const getInventorySummary = async (req, res, next) => {
  try {
    const summary = await Inventory.aggregate([
      {
        $group: {
          _id: "$category",
          totalItems: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ["$stock", "$lowStockThreshold"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/recent-orders
const getRecentOrders = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const safeLimit = Math.min(Math.max(limit, 1), 50); // protect against huge requests

    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(safeLimit);

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/low-stock — items at or below their threshold
const getLowStockInventory = async (req, res, next) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).sort({ stock: 1 });

    return res.status(200).json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getOrderStats,
  getRevenueStats,
  getInventorySummary,
  getRecentOrders,
  getLowStockInventory,
};
