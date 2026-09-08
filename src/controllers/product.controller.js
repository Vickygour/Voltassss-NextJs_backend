const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const Product = require("../models/Product.model");

// @desc    Get all products with filtering, search, sort & pagination
// @route   GET /api/v1/products
// @access  Public
// Query params supported (all optional):
//   category=sneakers|tshirts|pants|formal
//   tab=new|bestseller|featured
//   search=free text (matches name/brand/description)
//   minPrice, maxPrice
//   sort=price_asc|price_desc|rating|newest  (default: newest)
//   page, limit  (default 1 / 12)
const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    tab,
    search,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
  } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (tab) filter.tab = tab;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
    newest: { createdAt: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Math.min(50, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortMap[sort] || sortMap.newest).skip(skip).limit(limitNum),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Products fetched"
    )
  );
});

// @desc    Get a single product by its human-friendly id (e.g. "sn-001")
// @route   GET /api/v1/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return res.status(200).json(new ApiResponse(200, product, "Product fetched"));
});

// @desc    Get distinct categories with counts (useful for category nav)
// @route   GET /api/v1/products/meta/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $project: { _id: 0, category: "$_id", count: 1 } },
  ]);
  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
});

// @desc    Create a product
// @route   POST /api/v1/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  return res.status(201).json(new ApiResponse(201, product, "Product created"));
});

// @desc    Update a product
// @route   PATCH /api/v1/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate({ id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return res.status(200).json(new ApiResponse(200, product, "Product updated"));
});

// @desc    Delete a product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ id: req.params.id });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return res.status(200).json(new ApiResponse(200, null, "Product deleted"));
});

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
};
