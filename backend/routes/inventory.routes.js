const express = require("express");

const inventoryController = require("../controllers/inventory.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", inventoryController.getInventory);

router.get("/low-stock", inventoryController.getLowStockItems);

router.get("/category/:category", inventoryController.getInventoryByCategory);

router.post("/", inventoryController.createInventoryItem);

router.patch("/:id/stock", inventoryController.manuallyUpdateStock);      
router.patch("/:id/adjust", inventoryController.manuallyAdjustStock);     
router.patch("/:id/threshold", inventoryController.manuallyUpdateThreshold); 

router.get("/:id", inventoryController.getInventoryItem);
router.delete("/:id", inventoryController.deleteInventoryItem);

module.exports = router;
