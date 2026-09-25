const cron = require("node-cron");

const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");

const alertedItems = new Set();

const checkLowStock = async () => {
  try {
    console.log("🔍 Checking inventory levels...");

    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).lean();

    if (lowStockItems.length === 0) {
      alertedItems.clear();
      console.log("✅ No low-stock items found.");
      return;
    }

    const itemsToAlert = lowStockItems.filter((item) => !alertedItems.has(item._id.toString()));

    if (itemsToAlert.length === 0) {
      console.log("ℹ️ Low-stock alerts already sent.");
      return;
    }

    await Notification.insertMany(
      itemsToAlert.map((item) => ({
        type: "LOW_STOCK",
        title: "Low stock alert",
        message: `${item.name} is at ${item.stock} (threshold: ${item.lowStockThreshold}).`,
        relatedId: item._id,
      }))
    );

    itemsToAlert.forEach((item) => alertedItems.add(item._id.toString()));

    console.log(`⚠️ Low-stock notification created for ${itemsToAlert.length} item(s).`);
  } catch (error) {
    console.error("❌ Inventory job failed:", error.message);
  }
};

const startInventoryJob = () => {
  cron.schedule("*/10 * * * *", () => checkLowStock(), {
    timezone: process.env.CRON_TIMEZONE || "Asia/Karachi",
  });

  console.log("⏰ Inventory monitoring job started.");

  checkLowStock();
};

module.exports = { startInventoryJob, checkLowStock };