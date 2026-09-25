const Order = require("../models/Order");
const Pizza = require("../models/Pizza");
const { validatePizzaIngredients, restoreStock } = require("../services/inventory.service");

const ORDER_STATUSES = ["ORDER_RECEIVED", "IN_KITCHEN", "SENT_TO_DELIVERY", "DELIVERED", "CANCELLED"];

const createOrder = async (req, res, next) => {
  try {
    const { pizzaId, baseId, sauceId, cheeseId, vegetableIds = [], quantity = 1 } = req.body;

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) {
      return res.status(400).json({ success: false, message: "Quantity must be between 1 and 20." });
    }

    // Preset menu pizza, ordered as-is 
    if (pizzaId) {
      const pizza = await Pizza.findById(pizzaId);
      if (!pizza) {
        return res.status(404).json({ success: false, message: "Pizza not found." });
      }
      if (!pizza.isAvailable) {
        return res.status(400).json({ success: false, message: "This pizza is currently unavailable." });
      }

      const amount = pizza.price * parsedQuantity;

      const order = await Order.create({
        user: req.user._id,
        orderType: "preset",
        presetPizza: { id: pizza._id, name: pizza.name },
        quantity: parsedQuantity,
        amount,
        paymentStatus: "pending",
        orderStatus: "ORDER_RECEIVED",
      });

      return res.status(201).json({
        success: true,
        message: "Order created successfully. Proceed to payment.",
        order,
      });
    }

    // Builder-customized pizza 
    if (!Array.isArray(vegetableIds)) {
      return res.status(400).json({ success: false, message: "vegetableIds must be an array." });
    }

    const { base, sauce, cheese, vegetables } = await validatePizzaIngredients({
      baseId,
      sauceId,
      cheeseId,
      vegetableIds,
      quantity: parsedQuantity,
    });

    const ingredientPrice =
      base.price + sauce.price + cheese.price +
      vegetables.reduce((total, vegetable) => total + vegetable.price, 0);

    const amount = ingredientPrice * parsedQuantity;

    const order = await Order.create({
      user: req.user._id,
      orderType: "custom",
      pizza: {
        base: { id: base._id, name: base.name },
        sauce: { id: sauce._id, name: sauce.name },
        cheese: { id: cheese._id, name: cheese.name },
        vegetables: vegetables.map((vegetable) => ({ id: vegetable._id, name: vegetable.name })),
      },
      quantity: parsedQuantity,
      amount,
      paymentStatus: "pending",
      orderStatus: "ORDER_RECEIVED",
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully. Proceed to payment.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

const getMyOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Paid orders cannot be cancelled from this endpoint." });
    }
    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Order is already cancelled." });
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    return res.status(200).json({ success: true, message: "Order cancelled successfully.", order });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// Allowed statuses: ORDER_RECEIVED, IN_KITCHEN, SENT_TO_DELIVERY, DELIVERED, CANCELLED
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (order.orderStatus === "DELIVERED") {
      return res.status(400).json({ success: false, message: "A delivered order cannot be modified." });
    }
    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({ success: false, message: "A cancelled order cannot be modified." });
    }

    if (order.paymentStatus !== "paid" && status !== "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Payment has not been confirmed for this order, so its status can't be advanced.",
      });
    }

    if (status === "CANCELLED" && order.paymentStatus !== "paid") {
      order.orderStatus = "CANCELLED";
      await order.save();
      return res.status(200).json({ success: true, message: "Order cancelled.", order });
    }

    if (status === "CANCELLED" && order.paymentStatus === "paid" && order.orderType === "custom") {
      await restoreStock({
        baseId: order.pizza.base.id,
        sauceId: order.pizza.sauce.id,
        cheeseId: order.pizza.cheese.id,
        vegetableIds: order.pizza.vegetables.map((vegetable) => vegetable.id),
        quantity: order.quantity,
      });
    }

    order.orderStatus = status;
    await order.save();

    return res.status(200).json({ success: true, message: "Order status updated successfully.", order });
  } catch (error) {
    next(error);
  }
};

const getOrdersByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status." });
    }

    const orders = await Order.find({ orderStatus: status })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByStatus,
};