const { body, param } = require("express-validator");

const createReviewValidator = [
    body("productId")
        .notEmpty()
        .withMessage("Product ID is required")
        .isMongoId()
        .withMessage("Invalid product ID"),
    body("rating")
        .notEmpty()
        .withMessage("Rating is required")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),
    body("comment")
        .notEmpty()
        .withMessage("Review comment is required")
        .isLength({ min: 10 })
        .withMessage("Review must be at least 10 characters")
        .isLength({ max: 1000 })
        .withMessage("Review must be less than 1000 characters"),
    body("title")
        .optional()
        .isLength({ max: 100 })
        .withMessage("Title must be less than 100 characters"),
    body("images")
        .optional()
        .isArray()
        .withMessage("Images must be an array"),
];

const updateReviewValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid review ID"),
    body("rating")
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),
    body("comment")
        .optional()
        .isLength({ min: 10 })
        .withMessage("Review must be at least 10 characters")
        .isLength({ max: 1000 })
        .withMessage("Review must be less than 1000 characters"),
    body("title")
        .optional()
        .isLength({ max: 100 })
        .withMessage("Title must be less than 100 characters"),
];

const replyValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid review ID"),
    body("comment")
        .notEmpty()
        .withMessage("Reply comment is required")
        .isLength({ min: 3 })
        .withMessage("Reply must be at least 3 characters")
        .isLength({ max: 500 })
        .withMessage("Reply must be less than 500 characters"),
];

module.exports = {
    createReviewValidator,
    updateReviewValidator,
    replyValidator,
};