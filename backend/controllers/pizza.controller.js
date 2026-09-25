const Pizza = require("../models/Pizza");
const Inventory = require("../models/Inventory");


// GET ALL AVAILABLE PIZZAS
const getPizzas = async (req, res, next) => {
  try {
    const pizzas = await Pizza.find({
      isAvailable: true,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: pizzas.length,
      pizzas,
    });
  } catch (error) {
    next(error);
  }
};


// GET PIZZA BUILDER OPTIONS
const getPizzaOptions = async (req, res, next) => {
  try {
    const inventory = await Inventory.find({
      category: {
        $in: [
          "base",
          "sauce",
          "cheese",
          "vegetable",
        ],
      },

      stock: {
        $gt: 0,
      },
    }).sort({
      category: 1,
      name: 1,
    });

    const options = {
      bases: inventory.filter(
        (item) => item.category === "base"
      ),

      sauces: inventory.filter(
        (item) => item.category === "sauce"
      ),

      cheeses: inventory.filter(
        (item) => item.category === "cheese"
      ),

      vegetables: inventory.filter(
        (item) => item.category === "vegetable"
      ),
    };

    return res.status(200).json({
      success: true,
      options,
    });
  } catch (error) {
    next(error);
  }
};


// GET SINGLE PIZZA
const getPizzaById = async (req, res, next) => {
  try {
    const pizza = await Pizza.findOne({
      _id: req.params.id,
      isAvailable: true,
    });

    if (!pizza) {
      return res.status(404).json({
        success: false,
        message: "Pizza not found.",
      });
    }

    return res.status(200).json({
      success: true,
      pizza,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: get ALL pizzas 

const getAllPizzasAdmin = async (req, res, next) => {
  try {
    const pizzas = await Pizza.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: pizzas.length, pizzas });
  } catch (error) {
    next(error);
  }
};

// Create pizza 

const createPizza = async (req, res, next) => {
  try {
    const { name, description, image, ingredients, price, isAvailable } = req.body;

    if (!name || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, description and price are required.",
      });
    }

    const pizza = await Pizza.create({
      name: name.trim(),
      description: description.trim(),
      image: image || "",
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      price: Number(price),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    });

    return res.status(201).json({
      success: true,
      message: "Pizza created successfully.",
      pizza,
    });
  } catch (error) {
    next(error);
  }
};

// Update pizza
const updatePizza = async (req, res, next) => {
  try {
    const { name, description, image, ingredients, price, isAvailable } = req.body;

    const pizza = await Pizza.findById(req.params.id);
    if (!pizza) {
      return res.status(404).json({ success: false, message: "Pizza not found." });
    }

    if (name !== undefined) pizza.name = name.trim();
    if (description !== undefined) pizza.description = description.trim();
    if (image !== undefined) pizza.image = image;
    if (ingredients !== undefined && Array.isArray(ingredients)) pizza.ingredients = ingredients;
    if (price !== undefined) pizza.price = Number(price);
    if (isAvailable !== undefined) pizza.isAvailable = Boolean(isAvailable);

    await pizza.save();

    return res.status(200).json({
      success: true,
      message: "Pizza updated successfully.",
      pizza,
    });
  } catch (error) {
    next(error);
  }
};

// Delete pizza
const deletePizza = async (req, res, next) => {
  try {
    const pizza = await Pizza.findByIdAndDelete(req.params.id);
    if (!pizza) {
      return res.status(404).json({ success: false, message: "Pizza not found." });
    }
    return res.status(200).json({ success: true, message: "Pizza deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPizzas,
  getPizzaOptions,
  getPizzaById,
  getAllPizzasAdmin,
  createPizza,
  updatePizza,
  deletePizza,
};
