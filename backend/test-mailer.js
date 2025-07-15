require('dotenv').config();
const sendOtpEmail = require('./utils/mailer');

(async () => {
  try {
    console.log('Using API Key:', process.env.BREVO_API_KEY ? '***' : 'MISSING!');
    await sendOtpEmail('recipient@example.com', '123456');
    console.log('OTP sent successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
})();