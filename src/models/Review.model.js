const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating must be at most 5"],
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, "Title must be less than 100 characters"],
        },
        comment: {
            type: String,
            required: [true, "Review comment is required"],
            trim: true,
            minlength: [10, "Review must be at least 10 characters"],
            maxlength: [1000, "Review must be less than 1000 characters"],
        },
        images: [
            {
                type: String,
                trim: true,
            },
        ],
        likes: {
            type: Number,
            default: 0,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        helpful: {
            type: Number,
            default: 0,
        },
        replies: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                comment: {
                    type: String,
                    required: true,
                    trim: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                isAdmin: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
    },
    { timestamps: true }
);

// Index for faster queries
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // One review per product per user

// Static method to calculate average rating
reviewSchema.statics.getAverageRating = async function (productId) {
    const result = await this.aggregate([
        { $match: { product: productId, isApproved: true } },
        {
            $group: {
                _id: "$product",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
                ratingDistribution: {
                    $push: "$rating",
                },
            },
        },
    ]);

    if (result.length === 0) {
        return { averageRating: 0, totalReviews: 0, distribution: {} };
    }

    const distribution = {};
    result[0].ratingDistribution.forEach((r) => {
        distribution[r] = (distribution[r] || 0) + 1;
    });

    return {
        averageRating: result[0].averageRating,
        totalReviews: result[0].totalReviews,
        distribution,
    };
};

module.exports = mongoose.model("Review", reviewSchema);