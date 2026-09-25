const Order = require("../models/Order");
const Notification = require("../models/Notification");
const {
  createSafepayCheckout,
  verifySafepayRedirectSignature,
  verifySafepayWebhook,
} = require("../services/payment.service");
const { validatePizzaIngredients, deductStock } = require("../services/inventory.service");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";


const finalizePaidOrder = async (orderId) => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: "paid" } },
    { paymentStatus: "paid", orderStatus: "ORDER_RECEIVED", paidAt: new Date() },
    { new: true }
  );

  if (!order) return { alreadyPaid: true };

  try {
    await Notification.create({
      type: "NEW_ORDER",
      title: "New order received",
      message: `Order ${order._id.toString().slice(-6).toUpperCase()} — ${order.quantity} pizza(s), Rs. ${order.amount}.`,
      relatedId: order._id,
    });
  } catch (notifyError) {
    console.error("Failed to create order notification:", notifyError.message);
  }

  if (order.orderType === "custom") {
    const stockParams = {
      baseId: order.pizza.base.id,
      sauceId: order.pizza.sauce.id,
      cheeseId: order.pizza.cheese.id,
      vegetableIds: order.pizza.vegetables.map((vegetable) => vegetable.id),
      quantity: order.quantity,
    };

    try {
      await validatePizzaIngredients(stockParams);
      await deductStock(stockParams);
    } catch (error) {
      order.needsAttention = true;
      order.attentionReason = error.message;
      await order.save();
      console.error("Paid order needs attention:", order._id.toString(), error.message);
    }
  }

  return { order };
};

// POST /api/payments/create/:orderId — creates a Safepay checkout link for an existing pending order.
const createPayment = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Order has already been paid." });
    }
    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Cancelled orders cannot be paid." });
    }

    const { token, url } = await createSafepayCheckout({
      amount: order.amount,
      orderId: order._id,
    });

    order.safepayToken = token;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment checkout created.",
      payment: { checkoutUrl: url, orderId: order._id },
    });
  } catch (error) {
    next(error);
  }
};

// GET/POST /api/payments/callback/:orderId
const paymentCallback = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.redirect(`${CLIENT_URL}/order-confirmation?status=not_found`);
    }

    if (order.paymentStatus === "paid") {
      return res.redirect(`${CLIENT_URL}/order-confirmation?orderId=${orderId}`);
    }

    const sig = req.body?.sig ?? req.query?.sig;
    const tracker = req.body?.tracker ?? req.query?.tracker;

    console.log("[Safepay callback]", {
      method: req.method,
      orderId,
      query: req.query,
      body: req.body,
      savedToken: order.safepayToken,
      hasSig: Boolean(sig),
    });

    const trustRedirect =
      process.env.SAFEPAY_TRUST_REDIRECT === "true" &&
      (process.env.SAFEPAY_ENVIRONMENT || "sandbox") === "sandbox";

    if (trustRedirect && tracker && tracker === order.safepayToken) {
      console.warn("[Safepay callback] TRUST_REDIRECT enabled: skipping signature check (sandbox only).");
      await finalizePaidOrder(orderId);
      return res.redirect(`${CLIENT_URL}/order-confirmation?orderId=${orderId}`);
    }

    if (!sig || !tracker) {
      console.warn("[Safepay callback] Missing sig or tracker -> treated as cancelled.");
      return res.redirect(`${CLIENT_URL}/orders/${orderId}?payment=cancelled`);
    }

    if (tracker !== order.safepayToken) {
      console.warn("[Safepay callback] Tracker mismatch.", { tracker, saved: order.safepayToken });
      return res.redirect(`${CLIENT_URL}/orders/${orderId}?payment=invalid_signature`);
    }

    const isValid = await verifySafepayRedirectSignature(req);
    console.log("[Safepay callback] signature valid:", isValid);
    if (!isValid) {
      return res.redirect(`${CLIENT_URL}/orders/${orderId}?payment=invalid_signature`);
    }

    await finalizePaidOrder(orderId);
    return res.redirect(`${CLIENT_URL}/order-confirmation?orderId=${orderId}`);
  } catch (error) {
    console.error("Payment callback error:", error);
    return res.redirect(`${CLIENT_URL}/orders/${orderId}?payment=error`);
  }
};

const extractWebhookTracker = (body = {}) =>
  body?.data?.tracker?.token ||
  body?.data?.tracker ||
  body?.data?.token ||
  body?.tracker?.token ||
  body?.tracker ||
  body?.token ||
  null;

const extractWebhookEvent = (body = {}) =>
  String(body?.type || body?.event || body?.data?.type || "").toLowerCase();

const isSuccessEvent = (eventType) =>
  /(succeed|success|paid|complete|captur)/.test(eventType) &&
  !/(fail|refund|cancel|declin)/.test(eventType);

// POST /api/payments/webhook — Safepay's async notification of payment outcome.
const paymentWebhook = async (req, res, next) => {
  try {
    const isValid = await verifySafepayWebhook(req);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("Safepay webhook payload:", JSON.stringify(req.body));
    }

    const eventType = extractWebhookEvent(req.body);
    if (!isSuccessEvent(eventType)) {
      return res.status(200).json({ success: true, ignored: true }); // acknowledge, don't act
    }

    const tracker = extractWebhookTracker(req.body);
    const order = tracker
      ? await Order.findOne({ safepayToken: tracker })
      : await Order.findById(req.body?.orderId || req.body?.data?.orderId);

    if (!order) {
      return res.status(200).json({ success: true }); 
    }

    await finalizePaidOrder(order._id);
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};


const paymentFailed = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Payment has already been completed." });
    }

    return res.status(200).json({ success: true, message: "Payment not completed. You can try again.", order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  paymentCallback,
  paymentWebhook,
  paymentFailed,
};