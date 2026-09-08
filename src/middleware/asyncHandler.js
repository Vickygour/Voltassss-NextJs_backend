/**
 * Wraps an async route handler so any thrown/rejected error
 * is forwarded to next(), instead of needing try/catch everywhere.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
