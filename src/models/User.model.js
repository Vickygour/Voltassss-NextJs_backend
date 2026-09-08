const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    pin: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    defaultAddress: addressSchema,
    passwordChangedAt: Date,

    // ✅ NEW FIELDS FOR OTP
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: {
      type: String,
      select: false,
    },
    verificationOTPExpiry: {
      type: Date,
      select: false,
    },
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordOTPExpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});



// Instance method to compare plaintext password with the hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ✅ Generate 6-digit OTP
userSchema.methods.generateOTP = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ Generate verification OTP
userSchema.methods.generateVerificationOTP = function () {
  const otp = this.generateOTP();
  this.verificationOTP = otp;
  this.verificationOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// ✅ Generate reset password OTP
userSchema.methods.generateResetPasswordOTP = function () {
  const otp = this.generateOTP();
  this.resetPasswordOTP = otp;
  this.resetPasswordOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Strip sensitive fields whenever a user doc is sent as JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  delete obj.verificationOTP;
  delete obj.verificationOTPExpiry;
  delete obj.resetPasswordOTP;
  delete obj.resetPasswordOTPExpiry;
  return obj;
};

module.exports = mongoose.model("User", userSchema);