const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/User.model");

/**
 * Reads the access token from the httpOnly cookie (preferred) or the
 * Authorization: Bearer <token> header (useful for Postman/mobile clients),
 * verifies it, and attaches the user document to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authenticated. Please log in.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Session expired. Please refresh your token or log in again.");
    }
    throw new ApiError(401, "Invalid token. Please log in again.");
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    throw new ApiError(401, "User belonging to this token no longer exists.");
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to specific roles, e.g. restrictTo("admin").
 * Must be used after `protect`.
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  next();
};

module.exports = { protect, restrictTo };
