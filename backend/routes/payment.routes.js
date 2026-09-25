const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const {
  createPayment,
  paymentCallback,
  paymentWebhook,
  paymentFailed,
} = require("../controllers/payment.controller");

router.post("/create/:orderId", authMiddleware, createPayment);

router.get("/callback/:orderId", paymentCallback);
router.post("/callback/:orderId", paymentCallback);

router.post("/webhook", paymentWebhook);

router.post("/failed", authMiddleware, paymentFailed);

module.exports = router;