require('dotenv').config();
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Configure API key
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const SENDER = {
  email: 'ravi19mishra10@gmail.com',
  name: 'Auto-drive'
};

const sendOtpEmail = async (email, otp) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('Brevo API key not configured');
    }

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    // Set properties directly on the instance
    sendSmtpEmail.sender = SENDER;
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = 'Your One-Time Password (OTP)';
    sendSmtpEmail.textContent = `Your OTP code is: ${otp}`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; padding: 15px 30px; background-color: #e0e7ff; border-radius: 8px; font-size: 28px;">
            ${otp}
          </div>
        </div>
        <p style="text-align: center; color: #6b7280;">
          &copy; ${new Date().getFullYear()} ${SENDER.name}
        </p>
      </div>
    `;

    console.log('Sending email with:', {
      sender: sendSmtpEmail.sender,
      to: sendSmtpEmail.to,
      subject: sendSmtpEmail.subject
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