const asyncHandler = require("../middleware/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const User = require("../models/User.model");
const Product = require("../models/Product.model");

// @desc    Get logged-in user's wishlist (populated with product data)
// @route   GET /api/v1/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  return res.status(200).json(new ApiResponse(200, user.wishlist, "Wishlist fetched"));
});

// @desc    Toggle a product in/out of the wishlist (matches WishlistContext.toggle)
// @route   POST /api/v1/wishlist/toggle
// @body    { productId: "sn-001" }   <- the human-friendly Product.id
// @access  Private
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new ApiError(400, "productId is required");

  const product = await Product.findOne({ id: productId });
  if (!product) throw new ApiError(404, "Product not found");

  const user = await User.findById(req.user._id);
  const index = user.wishlist.findIndex((p) => p.toString() === product._id.toString());

  let saved;
  if (index > -1) {
    user.wishlist.splice(index, 1);
    saved = false;
  } else {
    user.wishlist.push(product._id);
    saved = true;
  }

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { saved, wishlist: user.wishlist }, saved ? "Added to wishlist" : "Removed from wishlist"));
});

module.exports = { getWishlist, toggleWishlist };
