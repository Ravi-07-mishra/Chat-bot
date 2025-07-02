const { body, validationResult, oneOf } = require("express-validator");

// Middleware to run validations and handle errors
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  };
};

// Auth validators
const loginValidator = [
  body("email").trim().isEmail().withMessage("Invalid email format"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password should contain at least 6 characters"),
];

const signupValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  ...loginValidator,
];

// Chat validators: require either message or image
const chatCompletionValidator = [
  oneOf([
    body("message").notEmpty(),
    body("image").notEmpty(),
  ], "Either message or image is required"),
  body("conversationId").optional().isString(),
];

const streamChatValidator = [
  oneOf([
    body("message").notEmpty(),
    body("image").notEmpty(),
  ], "Either message or image is required"),
  body("conversationId").optional().isString(),
];

// Upload validator: accept JSON base64 fields or multer file
const uploadValidator = [
  oneOf([
    body("image").exists().isString(),
    body("imageBase64").exists().isString(),
  ], 'Image is required (as base64 in "image" or "imageBase64")'),
  body("message").optional().isString(),
  body("conversationId").optional().isString(),
];

module.exports = {
  validate,
  signupValidator,
  loginValidator,
  chatCompletionValidator,
  streamChatValidator,
  uploadValidator,
};
