const { body, validationResult } = require("express-validator");

// Validate function
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    
    next();
  };
};

// Validators
const loginValidator = [
  body("email").trim().isEmail().withMessage("Invalid email format"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Should contain at least 6 characters"),
];

const signupValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  ...loginValidator,
];

const chatCompletionValidator = [
  body("message").notEmpty().withMessage("Message is required"),
  body("conversationId").optional().isString(),
  body("image").optional().isString()
];

const streamChatValidator = [
  body("message").notEmpty().withMessage("Message is required"),
  body("conversationId").optional().isString(),
  body("image").optional().isString()
];

const uploadValidator = [
  body("imageBase64").notEmpty().withMessage("Image is required"),
  body("message").optional().isString(),
  body("conversationId").optional().isString()
];

module.exports = {
  validate,
  signupValidator,
  loginValidator,
  chatCompletionValidator,
  streamChatValidator,
  uploadValidator
};