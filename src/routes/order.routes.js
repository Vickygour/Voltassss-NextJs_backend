const express = require("express");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createOrderValidator } = require("../validators/order.validator");

const router = express.Router();

router.use(protect);

router.get("/admin/all", restrictTo("admin"), getAllOrders);
router.post("/", createOrderValidator, validate, createOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", restrictTo("admin"), updateOrderStatus);

module.exports = router;
