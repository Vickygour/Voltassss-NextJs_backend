const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// Behind a proxy (Render/Railway/Vercel etc) - needed for correct secure cookies / rate-limit IPs
app.set("trust proxy", 1);

// --- Security & core middleware -------------------------------------------------
app.use(helmet());
app.use(mongoSanitize()); // strips $/. operators from req.body/query/params to prevent NoSQL injection
app.use(hpp()); // prevents HTTP parameter pollution

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // required so the browser sends/receives the httpOnly auth cookies
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Generic rate limiter for all API routes (auth routes have a stricter one on top of this)
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 300,
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use("/api", apiLimiter);

// --- Routes -----------------------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Voltra API is running" });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/v1", routes);

// --- 404 + error handling (must be last) -------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
