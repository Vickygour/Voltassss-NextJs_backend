const express = require("express");
const {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    toggleLike,
    addReply,
} = require("../controllers/review.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
    createReviewValidator,
    updateReviewValidator,
    replyValidator,
} = require("../validators/review.validator");

const router = express.Router();

// Public routes
router.get("/product/:productId", getProductReviews);

// Protected routes
router.use(protect);

// Create review
router.post("/", createReviewValidator, validate, createReview);

// Update/Delete review
router.patch("/:id", updateReviewValidator, validate, updateReview);
router.delete("/:id", deleteReview);

// Like/Unlike review
router.post("/:id/like", toggleLike);

// Admin only - Reply to review
router.post("/:id/reply", restrictTo("admin"), replyValidator, validate, addReply);

module.exports = router;