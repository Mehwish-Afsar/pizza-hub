const express = require("express");

const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const router = express.Router();

// Every route below requires a valid JWT and the admin role.
router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", adminController.getDashboardStats);
router.get("/order-stats", adminController.getOrderStats);
router.get("/revenue", adminController.getRevenueStats);
router.get("/inventory-summary", adminController.getInventorySummary);
router.get("/recent-orders", adminController.getRecentOrders);
router.get("/low-stock", adminController.getLowStockInventory);

module.exports = router;
