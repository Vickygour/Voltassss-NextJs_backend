require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

// Middleware: Ensure DB is connected before ANY route query runs
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Database Connection Error",
      error: err.message,
    });
  }
});

// Local development ke liye app.listen
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Voltra API running in development mode on port ${PORT}`);
  });
}

// Export app for Vercel Serverless Handler
module.exports = app;