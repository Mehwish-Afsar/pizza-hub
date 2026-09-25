const express = require("express");
const rateLimit = require("express-rate-limit");

const authController = require(
  "../controllers/auth.controller"
);

const authMiddleware = require(
  "../middleware/auth.middleware"
);

const router = express.Router();


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 50,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication requests. Please try again later.",
  },
});

// Register user
router.post(
  "/register",
  authLimiter,
  authController.register
);

// User login
router.post(
  "/login",
  authLimiter,
  authController.login
);

// Verify email
router.post(
  "/verify-email",
  authController.verifyEmail
);

// Resend verification
router.post(
  "/resend-verification",
  authLimiter,
  authController.resendVerification
);

// Forgot password
router.post(
  "/forgot-password",
  authLimiter,
  authController.forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  authLimiter,
  authController.resetPassword
);


  // ADMIN AUTHENTICATION

router.post(
  "/admin/login",
  authLimiter,
  authController.adminLogin
);

router.get(
  "/me",
  authMiddleware,
  authController.getMe
);

// Update profile
router.put(
  "/update-profile",
  authMiddleware,
  authController.updateProfile
);

// Change password 
router.put(
  "/change-password",
  authMiddleware,
  authController.changePassword
);

module.exports = router;
