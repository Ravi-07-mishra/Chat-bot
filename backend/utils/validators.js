const { body, validationResult } = require("express-validator");

// Validate function
const validate = (validations) => {
  return async (req, res, next) => {
    // Run validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Get validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // Proceed to the next middleware if no errors
    next();
  };
};
const LoginValidator = [
  
    body("email").trim().isEmail().withMessage("Invalid email format"),
    body("password").trim().isLength({ min: 6 }).withMessage("Should contain at least 6 characters"),
  ];
// Signup validator
const signupValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  ...LoginValidator,
];
const chatCompletionValidator = [
  body("message").notEmpty().withMessage("Message is required"),
 
];

module.exports = {validate,signupValidator,LoginValidator,chatCompletionValidator}