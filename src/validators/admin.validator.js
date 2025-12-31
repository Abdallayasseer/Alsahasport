const { body, query, param } = require("express-validator");
const validate = require("../middlewares/validate");

const loginAdmin = validate([
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
]);

const createCode = validate([
  body("durationDays")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 day"),
  body("maxDevices")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max devices must be at least 1"),
]);

const revealCode = validate([
  param("id").isMongoId().withMessage("Invalid Code ID"),
  body("password").notEmpty().withMessage("Password is required"),
]);

const addChannel = validate([
  body("name").trim().notEmpty().withMessage("Channel name is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
]);

module.exports = {
  validateLogin: loginAdmin,
  validateCreateCode: createCode,
  validateRevealCode: revealCode,
  validateAddChannel: addChannel,
};
