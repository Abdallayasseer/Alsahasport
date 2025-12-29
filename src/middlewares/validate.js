const { body, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new AppError(
        `Validation Error: ${errors
          .array()
          .map((e) => e.msg)
          .join(", ")}`,
        400
      )
    );
  }
  next();
};

exports.validateActivate = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isString()
    .withMessage("Code must be a string")
    .isLength({ min: 6 })
    .withMessage("Code must be at least 6 characters"),
  body("deviceId")
    .trim()
    .notEmpty()
    .withMessage("Device ID is required")
    .isString()
    .withMessage("Device ID must be a string"),
  validateRequest,
];

exports.validateLogin = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").trim().notEmpty().withMessage("Password is required"),
  validateRequest,
];

exports.validateCreateCode = [
  body("durationDays")
    .isInt({ min: 1 })
    .withMessage("Duration days must be a positive integer"),
  validateRequest,
];

exports.validateAddChannel = [
  body("name").trim().notEmpty().withMessage("Channel name is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("streamUrl")
    .trim()
    .notEmpty()
    .withMessage("Stream URL is required")
    .isURL()
    .withMessage("Must be a valid URL"),
  body("logoUrl").optional().isURL().withMessage("Logo must be a valid URL"),
  validateRequest,
];
