const mongoose = require("mongoose");

const ingredientRefSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const pizzaSchema = new mongoose.Schema(
  {
    base: { type: ingredientRefSchema, required: true },
    sauce: { type: ingredientRefSchema, required: true },
    cheese: { type: ingredientRefSchema, required: true },
    vegetables: [ingredientRefSchema],
  },
  { _id: false }
);

const presetPizzaSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Pizza", required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderType: { type: String, enum: ["custom", "preset"], default: "custom", index: true },

    pizza: { type: pizzaSchema },
    presetPizza: { type: presetPizzaSchema },

    quantity: { type: Number, required: true, min: 1, max: 20, default: 1 },
    amount: { type: Number, required: true, min: 0 },

    safepayToken: { type: String, default: null },

    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paidAt: { type: Date, default: null },

    // Set when a paid order could not have its stock deducted, so staff can reconcile it.
    needsAttention: { type: Boolean, default: false, index: true },
    attentionReason: { type: String, default: null },

    orderStatus: {
      type: String,
      enum: ["ORDER_RECEIVED", "IN_KITCHEN", "SENT_TO_DELIVERY", "DELIVERED", "CANCELLED"],
      default: "ORDER_RECEIVED",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);