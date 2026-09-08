const ApiError = require("../utils/ApiError");

/**
 * Catches unmatched routes and forwards a 404 ApiError.
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

/**
 * Central error handler. Converts known Mongoose/JWT errors into
 * clean ApiError-shaped JSON, and never leaks stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Internal server error";
    let errors = [];

    // Mongoose bad ObjectId
    if (error.name === "CastError") {
      statusCode = 400;
      message = `Invalid value for field "${error.path}"`;
    }

    // Mongoose validation error
    if (error.name === "ValidationError") {
      statusCode = 422;
      message = "Validation failed";
      errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyValue || {})[0];
      message = `${field} already exists`;
    }

    error = new ApiError(statusCode, message, errors);
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
