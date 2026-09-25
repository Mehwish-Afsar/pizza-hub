const Inventory = require("../models/Inventory");
const { updateStock, adjustStock, updateThreshold } = require("../services/inventory.service");

const ALLOWED_CATEGORIES = ["base", "sauce", "cheese", "vegetable"];

const getInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.find().sort({ category: 1, name: 1 });
    return res.status(200).json({ success: true, count: inventory.length, inventory });
  } catch (error) {
    next(error);
  }
};

const getLowStockItems = async (req, res, next) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    }).sort({ stock: 1 });
    return res.status(200).json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
};

const getInventoryByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid inventory category." });
    }

    const inventory = await Inventory.find({ category }).sort({ name: 1 });
    return res.status(200).json({ success: true, count: inventory.length, inventory });
  } catch (error) {
    next(error);
  }
};

const getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found." });
    }
    return res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

const createInventoryItem = async (req, res, next) => {
  try {
    const { name, category, stock, lowStockThreshold, price } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: "Name and category are required." });
    }
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid inventory category." });
    }

    const existing = await Inventory.findOne({ name: name.trim(), category });
    if (existing) {
      return res.status(409).json({ success: false, message: "This inventory item already exists." });
    }

    const item = await Inventory.create({
      name: name.trim(),
      category,
      stock: stock !== undefined ? Number(stock) : 0,
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 20,
      price: price !== undefined ? Number(price) : 0,
    });

    return res.status(201).json({ success: true, message: "Inventory item created successfully.", item });
  } catch (error) {
    next(error);
  }
};

const manuallyUpdateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const item = await updateStock(req.params.id, stock);
    return res.status(200).json({ success: true, message: "Stock updated successfully.", item });
  } catch (error) {
    next(error);
  }
};

const manuallyAdjustStock = async (req, res, next) => {
  try {
    const { adjustment } = req.body;
    const item = await adjustStock(req.params.id, adjustment);
    return res.status(200).json({ success: true, message: "Stock adjusted successfully.", item });
  } catch (error) {
    next(error);
  }
};

const manuallyUpdateThreshold = async (req, res, next) => {
  try {
    const { threshold } = req.body;
    const item = await updateThreshold(req.params.id, threshold);
    return res.status(200).json({
      success: true,
      message: "Low-stock threshold updated successfully.",
      item,
    });
  } catch (error) {
    next(error);
  }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found." });
    }
    return res.status(200).json({ success: true, message: "Inventory item deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getLowStockItems,
  getInventoryByCategory,
  getInventoryItem,
  createInventoryItem,
  manuallyUpdateStock,
  manuallyAdjustStock,
  manuallyUpdateThreshold,
  deleteInventoryItem,
};
