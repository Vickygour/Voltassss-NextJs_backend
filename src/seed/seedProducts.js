/**
 * Seeds MongoDB with the exact product catalog used by the Voltra
 * Next.js frontend (originally src/data/products.js), so the app
 * has real data to hit as soon as the backend is wired up.
 *
 * Usage:
 *   npm run seed            -> inserts/refreshes the product catalog
 *   npm run seed:destroy    -> deletes all products
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product.model");
const { products } = require("./products.data");

const run = async () => {
  await connectDB();

  if (process.argv.includes("--destroy")) {
    await Product.deleteMany();
    console.log("All products deleted.");
    return mongoose.connection.close();
  }

  await Product.deleteMany();
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products successfully.`);
  return mongoose.connection.close();
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
