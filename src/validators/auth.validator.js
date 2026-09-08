const { body } = require("express-validator");

// ✅ Register Validator
const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 50 })
    .withMessage("Name must not exceed 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email must not exceed 100 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .isLength({ max: 50 })
    .withMessage("Password must not exceed 50 characters")
    .matches(/\d/)
    .withMessage("Password must contain a number")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter"),
];

// ✅ Login Validator
const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

// ✅ Update Password Validator
const updatePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .isLength({ max: 50 })
    .withMessage("New password must not exceed 50 characters")
    .matches(/\d/)
    .withMessage("New password must contain a number")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter"),
];

// ✅ Email Validator (for forgot password, resend OTP)
const emailValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
];

// ✅ OTP Validator (for verify email, verify reset OTP)
const otpValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),
];

// ✅ Reset Password Validator (complete reset with OTP)
const resetPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .isLength({ max: 50 })
    .withMessage("New password must not exceed 50 characters")
    .matches(/\d/)
    .withMessage("New password must contain a number")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter"),
];

// ✅ Update Profile Validator
const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 50 })
    .withMessage("Name must not exceed 50 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),

  body("defaultAddress")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must not exceed 500 characters"),
];

// ✅ Address Validator
const addressValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Name must not exceed 50 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Address must not exceed 200 characters"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("City must not exceed 50 characters"),

  body("pin")
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN code must be exactly 6 digits")
    .isNumeric()
    .withMessage("PIN code must be numeric"),
];

module.exports = {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
  emailValidator,
  otpValidator,
  resetPasswordValidator,
  updateProfileValidator,
  addressValidator,
};