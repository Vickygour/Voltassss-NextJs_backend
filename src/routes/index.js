const express = require("express");
const authRoutes = require("./auth.routes");
const productRoutes = require("./product.routes");
const cartRoutes = require("./cart.routes");
const wishlistRoutes = require("./wishlist.routes");
const orderRoutes = require("./order.routes");
const reviewRoutes = require("./review.routes"); 

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes); 

module.exports = router;
