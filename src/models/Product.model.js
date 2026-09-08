const mongoose = require("mongoose");

/**
 * This schema intentionally mirrors src/data/products.js from the
 * Voltra Next.js frontend field-for-field, so the frontend can be
 * pointed at these API responses with zero shape changes.
 */
const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
    image: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // human-friendly slug id like "sn-001", kept unique so the frontend's
    // existing /product/[id] links keep working unchanged
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["sneakers", "tshirts", "pants", "formal"],
      index: true,
    },
    tab: {
      type: String,
      enum: ["new", "bestseller", "featured"],
      default: "featured",
    },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    features: [{ type: String }],
    colors: [colorSchema],
    images: [{ type: String }],
    sizes: [{ type: mongoose.Schema.Types.Mixed }],
    badge: { type: String },
    stock: { type: Number, default: 100, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", brand: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
