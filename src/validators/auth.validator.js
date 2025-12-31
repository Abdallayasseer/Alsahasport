const { body } = require("express-validator");
const validate = require("../middlewares/validate");

const validateActivate = validate([
  body("code").trim().notEmpty().withMessage("Activation code is required"),
  body("deviceId").trim().notEmpty().withMessage("Device ID is required"),
]);

module.exports = {
  validateActivate,
};
