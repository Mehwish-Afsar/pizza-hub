const express = require("express");

const pizzaController = require("../controllers/pizza.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const router = express.Router();


router.get("/", pizzaController.getPizzas);
router.get("/options", pizzaController.getPizzaOptions);


router.get("/admin/all", authMiddleware, adminMiddleware, pizzaController.getAllPizzasAdmin);
router.post("/admin", authMiddleware, adminMiddleware, pizzaController.createPizza);
router.put("/admin/:id", authMiddleware, adminMiddleware, pizzaController.updatePizza);
router.delete("/admin/:id", authMiddleware, adminMiddleware, pizzaController.deletePizza);


router.get("/:id", pizzaController.getPizzaById);

module.exports = router;