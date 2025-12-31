const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const validate = (validations) => {
  return async (req, res, next) => {
    // 1. Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // 2. Check for errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // 3. Format errors
    const extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

    // 4. Throw standard AppError
    // We join messages or just take the first one for the main error message
    const errorMessage = errors.array()[0].msg;

    // You can attach specific field errors to the response if your error handler supports it
    // For now, we just throw 400 with the first message.
    return next(new AppError(errorMessage, 400));
  };
};

module.exports = validate;
