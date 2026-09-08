const express = require("express");
const {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/meta/categories", getCategories);
router.get("/:id", getProductById);

// Admin-only product management
router.post("/", protect, restrictTo("admin"), createProduct);
router.patch("/:id", protect, restrictTo("admin"), updateProduct);
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);

module.exports = router;
