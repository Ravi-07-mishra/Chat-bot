const otpGenerator = require('otp-generator');
const OTP = require('../Models/otpModel'); // Your OTP Mongoose model
const User = require('../Models/Usermodel'); // Your User model
const sendOtpEmail = require('../utils/mailer');

// Generates and sends OTP to the provided email during signup
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user already exists
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(401).json({
        message: 'User is already registered with us',
      });
    }

    // Generate a 6-digit numeric OTP
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });

    // Ensure the OTP is unique in the database
    let result = await OTP.findOne({ otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });
      result = await OTP.findOne({ otp });
    }

    const otpPayload = { email, otp };
    await OTP.create(otpPayload);

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error("OTP send error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Verifies the OTP provided by the user during signup
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the OTP record by email and otp value
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Optionally, delete the OTP record after verification so it cannot be reused
    await OTP.deleteOne({ _id: otpRecord._id });

    // Proceed with signup (for example, create a new user) or mark the user as verified
    // For this example, we'll simply return a success message.
    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { sendOTP, verifyOTP };
