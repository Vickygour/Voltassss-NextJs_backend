const { body } = require("express-validator");

const createOrderValidator = [
  body("shippingAddress.name").trim().notEmpty().withMessage("Name is required"),
  body("shippingAddress.address").trim().notEmpty().withMessage("Address is required"),
  body("shippingAddress.city").trim().notEmpty().withMessage("City is required"),
  body("shippingAddress.pin").trim().notEmpty().withMessage("PIN code is required"),
  body("cardNumber")
    .optional({ checkFalsy: true })
    .isLength({ min: 12 })
    .withMessage("Card number looks too short"),
];

module.exports = { createOrderValidator };
