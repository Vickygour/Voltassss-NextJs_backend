const jwt = require("jsonwebtoken");

/**
 * Signs a short-lived access token carrying the user id + role.
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
  );
};

/**
 * Signs a longer-lived refresh token carrying only the user id.
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
  );
};

/**
 * Attaches both tokens as httpOnly cookies on the response.
 * httpOnly + sameSite protects against XSS/CSRF token theft.
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";

  const baseOptions = {
    httpOnly: true,
    secure: isProd, // only send over HTTPS in production
    sameSite: isProd ? "none" : "lax",
  };

  res.cookie("accessToken", accessToken, {
    ...baseOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
