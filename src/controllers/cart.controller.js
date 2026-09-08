const asyncHandler = require("../middleware/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");

/**
 * Cart endpoints mirror the actions of CartContext.jsx on the frontend
 * (ADD, REMOVE, UPDATE_QTY, CLEAR) so the reducer logic there can be
 * swapped for API calls with minimal changes. lineId is built the
 * same way: `${productId}__${color}__${size}`.
 */

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// @desc    Get logged-in user's cart
// @route   GET /api/v1/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  return res.status(200).json(new ApiResponse(200, cart, "Cart fetched"));
});

// @desc    Add an item to cart (or bump qty if same product/color/size exists)
// @route   POST /api/v1/cart/items
// @body    { productId, color, size, qty }
// @access  Private
const addItem = asyncHandler(async (req, res) => {
  const { productId, color, size, qty = 1 } = req.body;
  if (!productId || !color || size === undefined) {
    throw new ApiError(400, "productId, color and size are required");
  }

  const product = await Product.findOne({ id: productId });
  if (!product) throw new ApiError(404, "Product not found");

  const cart = await getOrCreateCart(req.user._id);
  const lineId = `${product.id}__${color}__${size}`;
  const existing = cart.items.find((i) => i.lineId === lineId);

  if (existing) {
    existing.qty += Number(qty);
  } else {
    const colorImage = product.colors.find((c) => c.name === color)?.image || product.images[0];
    cart.items.push({
      lineId,
      product: product._id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: colorImage,
      color,
      size,
      qty,
    });
  }

  await cart.save();
  return res.status(200).json(new ApiResponse(200, cart, "Item added to cart"));
});

// @desc    Update quantity of a single cart line
// @route   PATCH /api/v1/cart/items/:lineId
// @body    { qty }
// @access  Private
const updateItemQty = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  if (!qty || qty < 1) throw new ApiError(400, "qty must be at least 1");

  // ✅ Decode the lineId from URL (frontend sends encoded)
  const lineId = decodeURIComponent(req.params.lineId);

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.lineId === lineId);
  if (!item) throw new ApiError(404, "Cart line not found");

  item.qty = qty;
  await cart.save();
  return res.status(200).json(new ApiResponse(200, cart, "Cart updated"));
});

// @desc    Remove a single line from the cart
// @route   DELETE /api/v1/cart/items/:lineId
// @access  Private
const removeItem = asyncHandler(async (req, res) => {
  // ✅ Decode the lineId from URL (frontend sends encoded)
  const lineId = decodeURIComponent(req.params.lineId);

  const cart = await getOrCreateCart(req.user._id);
  const itemExists = cart.items.some((i) => i.lineId === lineId);
  if (!itemExists) throw new ApiError(404, "Cart line not found");

  cart.items = cart.items.filter((i) => i.lineId !== lineId);
  await cart.save();
  return res.status(200).json(new ApiResponse(200, cart, "Item removed from cart"));
});

// @desc    Empty the cart
// @route   DELETE /api/v1/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  return res.status(200).json(new ApiResponse(200, cart, "Cart cleared"));
});

module.exports = { getCart, addItem, updateItemQty, removeItem, clearCart };

