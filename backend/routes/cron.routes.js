const express = require("express");
const { checkLowStock } = require("../jobs/inventory.job");

const router = express.Router();

router.get("/low-stock-check", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    await checkLowStock();

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;