const express = require("express");
const { getWishlist, toggleWishlist } = require("../controllers/wishlist.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.post("/toggle", toggleWishlist);

module.exports = router;
