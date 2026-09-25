const mongoose = require("mongoose");

const pizzaSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Pizza name is required"], trim: true },
    description: { type: String, required: [true, "Pizza description is required"], trim: true },
    image: { type: String, default: "" },
    ingredients: [{ type: String, trim: true }],
    price: { type: Number, required: [true, "Pizza price is required"], min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pizza", pizzaSchema);
