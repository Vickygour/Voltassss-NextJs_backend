const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/generateTokens");
const {
  sendVerificationOTP,
  sendResetPasswordOTP,
} = require("../utils/email.service");

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    if (!existing.isVerified) {
      // If exists but not verified, generate new OTP
      const otp = existing.generateVerificationOTP();
      await existing.save({ validateBeforeSave: false });
      await sendVerificationOTP(email, otp, name);

      return res.status(200).json(
        new ApiResponse(200,
          { email: existing.email, isVerified: false },
          "User already exists. New verification OTP sent to your email."
        )
      );
    }
    throw new ApiError(409, "An account with this email already exists");
  }

  // Create new user
  const user = await User.create({ name, email, password });

  // Generate OTP
  const otp = user.generateVerificationOTP();
  await user.save({ validateBeforeSave: false });

  // Send OTP via email
  await sendVerificationOTP(email, otp, name);

  return res.status(201).json(
    new ApiResponse(201,
      { user: { id: user._id, name: user.name, email: user.email }, isVerified: false },
      "Account created. Please verify your email with the OTP sent."
    )
  );
});

// @desc    Verify email with OTP
// @route   POST /api/v1/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpiry');
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email already verified");
  }

  // Check OTP
  if (user.verificationOTP !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.verificationOTPExpiry < Date.now()) {
    throw new ApiError(400, "OTP expired. Please request a new one.");
  }

  // Verify user
  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationOTPExpiry = undefined;
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  return res.status(200).json(
    new ApiResponse(200,
      { user: { id: user._id, name: user.name, email: user.email }, accessToken },
      "Email verified successfully"
    )
  );
});

// @desc    Resend verification OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email already verified");
  }

  // Generate new OTP
  const otp = user.generateVerificationOTP();
  await user.save({ validateBeforeSave: false });

  // Send OTP
  await sendVerificationOTP(email, otp, user.name);

  return res.status(200).json(
    new ApiResponse(200, null, "New OTP sent to your email")
  );
});

// @desc    Log in an existing user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Check if email is verified
  if (!user.isVerified) {
    // Generate new OTP
    const otp = user.generateVerificationOTP();
    await user.save({ validateBeforeSave: false });
    await sendVerificationOTP(email, otp, user.name);

    throw new ApiError(403, "Email not verified. New OTP sent to your email.");
  }

  // Check if user is active (if you have this field)
  if (user.isActive === false) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  user.password = undefined;

  return res.status(200).json(
    new ApiResponse(200, { user, accessToken }, "Logged in successfully")
  );
});

// @desc    Forgot password - Send OTP
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }

  // Generate reset OTP
  const otp = user.generateResetPasswordOTP();
  await user.save({ validateBeforeSave: false });

  // Send OTP via email
  await sendResetPasswordOTP(email, otp, user.name);

  return res.status(200).json(
    new ApiResponse(200, null, "Password reset OTP sent to your email")
  );
});

// @desc    Verify reset OTP
// @route   POST /api/v1/auth/verify-reset-otp
// @access  Public
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordOTPExpiry');
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check OTP
  if (user.resetPasswordOTP !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.resetPasswordOTPExpiry < Date.now()) {
    throw new ApiError(400, "OTP expired. Please request a new one.");
  }

  return res.status(200).json(
    new ApiResponse(200, null, "OTP verified successfully")
  );
});

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP, and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordOTPExpiry');
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check OTP
  if (user.resetPasswordOTP !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.resetPasswordOTPExpiry < Date.now()) {
    throw new ApiError(400, "OTP expired. Please request a new one.");
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpiry = undefined;
  await user.save();

  // Generate new tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, { user: { id: user._id, name: user.name, email: user.email } },
      "Password reset successfully"
    )
  );
});

// @desc    Log out current user (clears cookies)
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  return res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

// @desc    Issue a fresh access token using the refresh token cookie
// @route   POST /api/v1/auth/refresh
// @access  Public (requires valid refreshToken cookie)
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new ApiError(401, "No refresh token provided. Please log in again.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, "Refresh token invalid or expired. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User no longer exists.");
  }

  if (user.isActive === false) {
    throw new ApiError(403, "Account is deactivated");
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  setAuthCookies(res, accessToken, newRefreshToken);

  return res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

// @desc    Get the currently logged-in user's profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});

// @desc    Update name / default address of logged-in user
// @route   PATCH /api/v1/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, defaultAddress } = req.body;

  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (defaultAddress) user.defaultAddress = defaultAddress;
  await user.save();

  return res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

// @desc    Change password of logged-in user
// @route   PATCH /api/v1/auth/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, null, "Password updated successfully")
  );
});

module.exports = {
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
};