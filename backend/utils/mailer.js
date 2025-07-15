// utils/mailer.js
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization from environment variables
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendOtpEmail = async (email, otp) => {
  try {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Use verified sender details from environment variables
    const sender = {
      email: process.env.BREVO_VERIFIED_SENDER,
      name: process.env.BREVO_SENDER_NAME || 'Auto-drive'
    };
    
    const receivers = [{ email }];
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
      sender,
      to: receivers,
      subject: 'Your One-Time Password (OTP)',
      textContent: `Your OTP code is: ${otp}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366f1; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">OTP Verification</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">Hello,</p>
            <p style="font-size: 16px; color: #374151;">
              Your one-time password for verification is:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="
                display: inline-block;
                padding: 15px 30px;
                background-color: #e0e7ff;
                border-radius: 8px;
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 5px;
                color: #4f46e5;
              ">
                ${otp}
              </div>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              This OTP is valid for 5 minutes. Please do not share this code with anyone.
            </p>
          </div>
          <div style="padding: 20px; text-align: center; background-color: #f3f4f6; color: #6b7280; font-size: 14px;">
            <p>If you didn't request this OTP, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.BREVO_SENDER_NAME || 'Auto-drive'}</p>
          </div>
        </div>
      `
    });

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`OTP email sent to ${email} via Brevo`);
    return true;
  } catch (error) {
    console.error('Brevo API error:', error.response?.text || error.message);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = sendOtpEmail;