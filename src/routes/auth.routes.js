const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  verifyEmail,
  resendOTP,
  login,
  logout,
  refresh,
  getMe,
  updateMe,
  updatePassword,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
  emailValidator,
  otpValidator,
  resetPasswordValidator,
} = require("../validators/auth.validator");

const router = express.Router();

// Throttle auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

// ✅ Public routes
router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/verify-email", authLimiter, otpValidator, validate, verifyEmail);
router.post("/resend-otp", authLimiter, emailValidator, validate, resendOTP);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/forgot-password", authLimiter, emailValidator, validate, forgotPassword);
router.post("/verify-reset-otp", authLimiter, otpValidator, validate, verifyResetOTP);
router.post("/reset-password", authLimiter, resetPasswordValidator, validate, resetPassword);
router.post("/refresh", authLimiter, refresh);

// ✅ Private routes (require authentication)
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.patch("/update-password", protect, updatePasswordValidator, validate, updatePassword);

// ✅ Alias for frontend compatibility
router.post("/signup", authLimiter, registerValidator, validate, register);

module.exports = router;