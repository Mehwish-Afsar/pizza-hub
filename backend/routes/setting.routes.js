const express = require("express");

const settingsController = require("../controllers/setting.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", settingsController.getSettings);
router.patch("/", settingsController.updateSettings);

module.exports = router;