// utils/mailer.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key from environment
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// Non-sensitive sender info (can be hardcoded)
const SENDER_CONFIG = {
  email: 'ravi19mishra10@gmail.com', // Your verified sender
  name: 'Auto-drive' // Your brand name
};

const sendOtpEmail = async (email, otp) => {
  try {
    // Debug check for API key
    if (!process.env.BREVO_API_KEY) {
      throw new Error('Brevo API key not configured');
    }

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
  sender: {
    email: SENDER_CONFIG.email,   // Your verified sender email
    name: SENDER_CONFIG.name      // Brand name or your app name
  },
  to: [{ email }],
  subject: 'Your One-Time Password (OTP)',
  textContent: `Your OTP code is: ${otp}`,
  htmlContent: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; padding: 15px 30px; background-color: #e0e7ff; border-radius: 8px; font-size: 28px;">
          ${otp}
        </div>
      </div>
      <p style="text-align: center; color: #6b7280;">
        &copy; ${new Date().getFullYear()} ${SENDER_CONFIG.name}
      </p>
    </div>
  `
});


    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error('Brevo Error:', {
      message: error.message,
      status: error.response?.statusCode,
      body: error.response?.body
    });
    throw new Error('Failed to send OTP email');
  }
};

module.exports = sendOtpEmail;