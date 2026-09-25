const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../services/email.service");

//  Helpers
const generateToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  address: {
    line1: user.address?.line1 || "",
    city: user.address?.city || "",
    notes: user.address?.notes || "",
  },
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

const ADDRESS_FIELDS = [
  ["line1", 200, "Street address"],
  ["city", 80, "City"],
  ["notes", 200, "Delivery notes"],
];

// Register 
const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must contain at least 6 characters." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = hashToken(verificationToken);
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      isVerified: false,
      verificationTokenHash,
      verificationTokenExpires,
    });

    try {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

      await sendVerificationEmail({
        name: user.name,
        email: user.email,
        verificationUrl,
      });
    } catch (emailError) {
      console.error("Verification email failed:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// Verify email 
const verifyEmail = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token;
    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is required." });
    }

    const user = await User.findOne({
      verificationTokenHash: hashToken(token),
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
    }

    user.isVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenExpires = null;
    await user.save();

    return res.json({ success: true, message: "Email verified successfully. You can now log in." });
  } catch (error) {
    next(error);
  }
};

// Resend verification
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({ success: true, message: "If an account exists, a verification email has been sent." });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "This email is already verified." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationTokenHash = hashToken(verificationToken);
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      verificationUrl,
    });

    return res.json({ success: true, message: "Verification email sent successfully." });
  } catch (error) {
    next(error);
  }
};

// User login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Please use the admin login." });
    }
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
    }

    const token = generateToken(user);

    return res.json({ success: true, message: "Login successful.", token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

// Admin login 
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const admin = await User.findOne({ email: normalizedEmail, role: "admin" }).select("+password");
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials." });
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials." });
    }

    const token = generateToken(admin);

    return res.json({ success: true, message: "Admin login successful.", token, user: sanitizeUser(admin) });
  } catch (error) {
    next(error);
  }
};

// Forgot password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordTokenHash = hashToken(resetToken);
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      try {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        await sendPasswordResetEmail({
          name: user.name,
          email: user.email,
          resetUrl,
        });
      } catch (emailError) {
        console.error("Password reset email failed:", emailError.message);
      }
    }

    return res.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Reset token and new password are required." });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must contain at least 6 characters." });
    }

    const user = await User.findOne({
      resetPasswordTokenHash: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired password reset token." });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getMe = async (req, res) => {
  return res.json({ success: true, user: sanitizeUser(req.user) });
};

// Update profile (name, phone, delivery address) 
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Please enter your full name." });
    }
    if (name.trim().length > 80) {
      return res.status(400).json({ success: false, message: "Name must be 80 characters or fewer." });
    }

    const update = { name: name.trim() };

    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({ success: false, message: "Invalid phone number." });
      }
      const trimmedPhone = phone.trim();
      if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number (10-15 digits, e.g. +92 300 1234567).",
        });
      }
      update.phone = trimmedPhone;
    }

    if (address !== undefined) {
      if (typeof address !== "object" || address === null || Array.isArray(address)) {
        return res.status(400).json({ success: false, message: "Invalid address." });
      }

      for (const [key, maxLength, label] of ADDRESS_FIELDS) {
        const value = address[key];
        if (value === undefined) continue;

        if (typeof value !== "string" || value.trim().length > maxLength) {
          return res.status(400).json({
            success: false,
            message: `${label} must be ${maxLength} characters or fewer.`,
          });
        }
        update[`address.${key}`] = value.trim();
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// Change password 
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required." });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must contain at least 6 characters." });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  adminLogin,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};