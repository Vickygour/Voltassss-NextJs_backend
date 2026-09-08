const express = require("express");
const { getCart, addItem, updateItemQty, removeItem, clearCart } = require("../controllers/cart.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);
router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:lineId(.*)", updateItemQty);
router.delete("/items/:lineId(.*)", removeItem);
router.delete("/", clearCart);

module.exports = router;
