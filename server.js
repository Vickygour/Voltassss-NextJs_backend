require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Database connection attempt
    await connectDB();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }

  // 0.0.0.0 hostname missing hone par Railway access nahi kar pata
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Voltra API running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });

  // Graceful shutdown on unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();