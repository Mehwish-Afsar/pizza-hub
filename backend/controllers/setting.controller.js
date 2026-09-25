const Settings = require("../models/Setting");

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const { storeName, notificationEmail, lowStockThreshold, alerts } = req.body;

    if (notificationEmail !== undefined && notificationEmail !== "") {
      const emailPattern = /^\S+@\S+\.\S+$/;
      if (!emailPattern.test(notificationEmail)) {
        return res.status(400).json({ success: false, message: "Enter a valid notification email." });
      }
    }

    const settings = await Settings.getSingleton();

    if (storeName !== undefined) settings.storeName = storeName.trim();
    if (notificationEmail !== undefined) settings.notificationEmail = notificationEmail.trim();
    if (lowStockThreshold !== undefined) {
      settings.lowStockThreshold = Math.max(0, Number(lowStockThreshold) || 0);
    }
    if (alerts !== undefined) {
      if (alerts.lowStock !== undefined) settings.alerts.lowStock = Boolean(alerts.lowStock);
      if (alerts.newOrder !== undefined) settings.alerts.newOrder = Boolean(alerts.newOrder);
      if (alerts.daily !== undefined) settings.alerts.daily = Boolean(alerts.daily);
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };