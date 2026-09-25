const express = require("express");

const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const router = express.Router();

router.use(authMiddleware);

// User routes
router.post("/", orderController.createOrder);
router.get("/my-orders", orderController.getMyOrders);
router.get("/my-orders/:id", orderController.getMyOrderById);
router.patch("/:id/cancel", orderController.cancelOrder);

// Admin routes 
router.use(adminMiddleware);

router.get("/admin/all", orderController.getAllOrders);
router.get("/admin/status/:status", orderController.getOrdersByStatus); 
router.get("/admin/:id", orderController.getOrderById);
router.patch("/admin/:id/status", orderController.updateOrderStatus);   

module.exports = router;
