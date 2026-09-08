const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const Review = require("../models/Review.model");
const Product = require("../models/Product.model");
const User = require("../models/User.model");
const Order = require("../models/Order.model"); // ✅ Add this import

// @desc    Get all reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "recent" } = req.query;

    // Check if product exists
    const product = await Product.findOne({ id: productId }) || await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Sort options
    const sortOptions = {
        recent: { createdAt: -1 },
        helpful: { helpful: -1 },
        highest: { rating: -1 },
        lowest: { rating: 1 },
    };

    const sortBy = sortOptions[sort] || sortOptions.recent;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({
        product: product._id || productId,
        isApproved: true
    })
        .populate("user", "name email")
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Review.countDocuments({
        product: product._id || productId,
        isApproved: true
    });

    // Get rating stats
    const stats = await Review.getAverageRating(product._id || productId);

    return res.status(200).json(
        new ApiResponse(200, {
            reviews,
            stats,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, "Reviews fetched successfully")
    );
});

// @desc    Create a new review
// @route   POST /api/v1/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
    const { productId, rating, title, comment, images = [] } = req.body;
    const userId = req.user._id;

    // Check if product exists
    let product = await Product.findOne({ id: productId }) || await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
        user: userId,
        product: product._id || productId
    });
    if (existingReview) {
        throw new ApiError(400, "You have already reviewed this product");
    }

    // Check if user purchased this product (optional - for verified badge)
    let isVerified = false;
    try {
        const order = await Order.findOne({
            user: userId,
            "items.productId": productId,
            status: "delivered",
        });
        isVerified = !!order;
    } catch (err) {
        // If Order model doesn't exist or error, just set isVerified to false
        isVerified = false;
    }

    const review = await Review.create({
        user: userId,
        product: product._id || productId,
        rating,
        title,
        comment,
        images,
        isVerified,
        isApproved: process.env.NODE_ENV === "development" ? true : false,
    });

    // Populate user details
    await review.populate("user", "name email");

    return res.status(201).json(
        new ApiResponse(201, review, "Review submitted successfully")
    );
});

// @desc    Update a review
// @route   PATCH /api/v1/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== userId.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You are not authorized to update this review");
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = images;

    await review.save();
    await review.populate("user", "name email");

    return res.status(200).json(
        new ApiResponse(200, review, "Review updated successfully")
    );
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== userId.toString() && req.user.role !== "admin") {
        throw new ApiError(403, "You are not authorized to delete this review");
    }

    await review.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Review deleted successfully")
    );
});

// @desc    Like/Unlike a review
// @route   POST /api/v1/reviews/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    // Check if user already liked
    const likedIndex = review.likedBy?.indexOf(userId);

    if (likedIndex !== undefined && likedIndex > -1) {
        // Unlike
        review.likedBy.splice(likedIndex, 1);
        review.likes = Math.max(0, review.likes - 1);
    } else {
        // Like
        if (!review.likedBy) review.likedBy = [];
        review.likedBy.push(userId);
        review.likes += 1;
    }

    await review.save();

    return res.status(200).json(
        new ApiResponse(200, { likes: review.likes, liked: likedIndex === -1 }, "Review updated")
    );
});

// @desc    Add reply to review
// @route   POST /api/v1/reviews/:id/reply
// @access  Private (Admin only)
const addReply = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user._id;

    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can reply to reviews");
    }

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    review.replies.push({
        user: userId,
        comment,
        isAdmin: true,
    });

    await review.save();
    await review.populate("replies.user", "name email");

    return res.status(200).json(
        new ApiResponse(200, review, "Reply added successfully")
    );
});

module.exports = {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    toggleLike,
    addReply,
};