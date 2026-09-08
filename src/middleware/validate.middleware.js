const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Runs after an array of express-validator checks.
 * If any validation failed, turns them into a single ApiError
 * with a clean list of field/message pairs.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  throw new ApiError(422, "Validation failed", formatted);
};

module.exports = validate;
