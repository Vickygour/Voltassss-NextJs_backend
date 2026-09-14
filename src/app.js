const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const connectDB = require("./config/db"); // 1. DB connection helper import karein
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// Required for proxy headers (Vercel, Railway, Render)
app.set("trust proxy", 1);

// --- Security & core middleware -------------------------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(mongoSanitize());
app.use(hpp());

// CORS Setup
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Rate Limiting
if (process.env.NODE_ENV !== "production") {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);
}

// --- Health Check Routes (Without DB middleware) ------------------------------
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Voltra API is running" });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK", timestamp: new Date().toISOString() });
});

// --- 2. Database Connection Middleware (MUST BE BEFORE API ROUTES) ------------
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failure in middleware:", err.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: err.message,
    });
  }
});

// --- API Routes ---------------------------------------------------------------
app.use("/api/v1", routes);

// --- 404 + error handling ---------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;