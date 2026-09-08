const mongoose = require("mongoose");

/**
 * Mirrors the shape produced by CartContext.jsx on the frontend
 * (lineId = `${productId}__${color}__${size}`) so cart state can be
 * persisted per logged-in user across devices/sessions.
 */
const cartItemSchema = new mongoose.Schema(
  {
    lineId: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    brand: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    color: { type: String },
    size: { type: mongoose.Schema.Types.Mixed },
    qty: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
