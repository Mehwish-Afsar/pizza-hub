const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Inventory item name is required"], trim: true },
    category: {
      type: String,
      required: [true, "Inventory category is required"],
      enum: ["base", "sauce", "cheese", "vegetable"],
      index: true,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 20 },
    price: { type: Number, min: 0, default: 0 },
    lastLowStockNotificationAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inventorySchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
