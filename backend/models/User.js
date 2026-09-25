const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    address: {
      line1: { type: String, trim: true, maxlength: 200, default: "" },
      city: { type: String, trim: true, maxlength: 80, default: "" },
      notes: { type: String, trim: true, maxlength: 200, default: "" },
    },

    isVerified: { type: Boolean, default: false },
    verificationTokenHash: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);