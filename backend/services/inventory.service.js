const Inventory = require("../models/Inventory");

const normalizeId = (id) => (id ? id.toString() : null);


const validatePizzaIngredients = async ({ baseId, sauceId, cheeseId, vegetableIds = [], quantity = 1 }) => {
  if (!baseId) throw new Error("Pizza base is required.");
  if (!sauceId) throw new Error("Pizza sauce is required.");
  if (!cheeseId) throw new Error("Cheese type is required.");
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a positive integer.");
  }

  const ids = [baseId, sauceId, cheeseId, ...vegetableIds];
  const uniqueIds = [...new Set(ids.map(normalizeId))];

  const ingredients = await Inventory.find({ _id: { $in: uniqueIds } });
  if (ingredients.length !== uniqueIds.length) {
    throw new Error("One or more selected ingredients do not exist.");
  }

  const ingredientMap = new Map(ingredients.map((item) => [normalizeId(item._id), item]));

  const getChecked = (id, category, label) => {
    const item = ingredientMap.get(normalizeId(id));
    if (!item) throw new Error(`Selected ${label} was not found.`);
    if (item.category !== category) throw new Error(`Selected item is not a valid ${label}.`);
    return item;
  };

  const base = getChecked(baseId, "base", "pizza base");
  const sauce = getChecked(sauceId, "sauce", "sauce");
  const cheese = getChecked(cheeseId, "cheese", "cheese");

  const vegetables = vegetableIds.map((vegetableId) => {
    const vegetable = ingredientMap.get(normalizeId(vegetableId));
    if (!vegetable) throw new Error("One or more selected vegetables were not found.");
    if (vegetable.category !== "vegetable") throw new Error("One of the selected items is not a vegetable.");
    return vegetable;
  });

  const requiredQuantity = quantity;
  for (const ingredient of [base, sauce, cheese, ...vegetables]) {
    if (ingredient.stock < requiredQuantity) {
      throw new Error(
        `${ingredient.name} does not have enough stock. Available: ${ingredient.stock}, Required: ${requiredQuantity}.`
      );
    }
  }

  return { base, sauce, cheese, vegetables };
};

const deductStock = async ({ baseId, sauceId, cheeseId, vegetableIds = [], quantity = 1 }) => {
  const uniqueIds = [...new Set([baseId, sauceId, cheeseId, ...vegetableIds].map(normalizeId))];
  const deductedItems = [];

  try {
    for (const ingredientId of uniqueIds) {
      const ingredient = await Inventory.findOneAndUpdate(
        { _id: ingredientId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!ingredient) {
        throw new Error("Insufficient stock. Order cannot be completed.");
      }
      deductedItems.push({ id: ingredient._id, quantity });
    }
    return deductedItems;
  } catch (error) {
    for (const item of deductedItems) {
      await Inventory.findByIdAndUpdate(item.id, { $inc: { stock: item.quantity } });
    }
    throw error;
  }
};

// Restores stock 
const restoreStock = async ({ baseId, sauceId, cheeseId, vegetableIds = [], quantity = 1 }) => {
  const uniqueIds = [...new Set([baseId, sauceId, cheeseId, ...vegetableIds].map(normalizeId))];
  await Inventory.updateMany({ _id: { $in: uniqueIds } }, { $inc: { stock: quantity } });
  return true;
};

const updateStock = async (inventoryId, stock) => {
  if (stock === undefined || stock === null) {
    throw new Error("Stock quantity is required.");
  }
  const parsedStock = Number(stock);
  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    throw new Error("Stock must be a non-negative integer.");
  }

  const item = await Inventory.findByIdAndUpdate(
    inventoryId,
    { stock: parsedStock },
    { new: true, runValidators: true }
  );
  if (!item) throw new Error("Inventory item not found.");
  return item;
};

// Admin increases/decreases stock by a relative amount
const adjustStock = async (inventoryId, adjustment) => {
  const parsedAdjustment = Number(adjustment);
  if (!Number.isInteger(parsedAdjustment)) {
    throw new Error("Stock adjustment must be an integer.");
  }

  const item = await Inventory.findOneAndUpdate(
    {
      _id: inventoryId,
      $expr: { $gte: [{ $add: ["$stock", parsedAdjustment] }, 0] }, 
    },
    { $inc: { stock: parsedAdjustment } },
    { new: true }
  );
  if (!item) throw new Error("Inventory item not found or adjustment would make stock negative.");
  return item;
};

const updateThreshold = async (inventoryId, threshold) => {
  const parsedThreshold = Number(threshold);
  if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0) {
    throw new Error("Low-stock threshold must be a non-negative integer.");
  }

  const item = await Inventory.findByIdAndUpdate(
    inventoryId,
    { lowStockThreshold: parsedThreshold },
    { new: true, runValidators: true }
  );
  if (!item) throw new Error("Inventory item not found.");
  return item;
};

module.exports = {
  validatePizzaIngredients,
  deductStock,
  restoreStock,
  updateStock,
  adjustStock,
  updateThreshold,
};
