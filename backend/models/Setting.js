const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "PizzaHub" },
    notificationEmail: { type: String, default: "" },
    lowStockThreshold: { type: Number, default: 20, min: 0 },
    alerts: {
      lowStock: { type: Boolean, default: true },
      newOrder: { type: Boolean, default: true },
      daily: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);