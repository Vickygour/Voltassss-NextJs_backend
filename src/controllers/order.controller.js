const asyncHandler = require("../middleware/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Order = require("../models/Order.model");
const Cart = require("../models/Cart.model");

const generateOrderNumber = () => `VLT-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

// @desc    Place an order from the logged-in user's current cart
//          (mirrors the checkout page: shipping form -> payment -> confirm)
// @route   POST /api/v1/orders
// @body    { shippingAddress: { name, address, city, pin }, cardNumber? }
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, cardNumber } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty — nothing to check out");
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shippingFee = subtotal > 2999 ? 0 : 149;
  const total = subtotal + shippingFee;

  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map((i) => ({
      product: i.product,
      name: i.name,
      image: i.image,
      price: i.price,
      color: i.color,
      size: i.size,
      qty: i.qty,
    })),
    shippingAddress,
    subtotal,
    shippingFee,
    total,
    // This is a demo checkout - we never store full card numbers, only last 4
    cardLast4: cardNumber ? String(cardNumber).replace(/\s/g, "").slice(-4) : undefined,
    orderNumber: generateOrderNumber(),
  });

  // Clear the cart after a successful order, same as CartContext.clear() on the frontend
  cart.items = [];
  await cart.save();

  return res.status(201).json(new ApiResponse(201, order, "Order placed successfully"));
});

// @desc    Get all orders for the logged-in user
// @route   GET /api/v1/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, orders, "Orders fetched"));
});

// @desc    Get a single order by id (must belong to the requesting user, unless admin)
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have access to this order");
  }

  return res.status(200).json(new ApiResponse(200, order, "Order fetched"));
});

// @desc    Get all orders (admin)
// @route   GET /api/v1/orders/admin/all
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, orders, "All orders fetched"));
});

// @desc    Update order status (admin)
// @route   PATCH /api/v1/orders/:id/status
// @body    { status: "pending"|"confirmed"|"shipped"|"delivered"|"cancelled" }
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!order) throw new ApiError(404, "Order not found");
  return res.status(200).json(new ApiResponse(200, order, "Order status updated"));
});

module.exports = { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus };
