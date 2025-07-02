const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Chatbot" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #0a0a0a; padding: 20px; text-align: center;">
            <h1 style="color: #00fffc; margin: 0;">Verification Code</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="font-size: 16px;">Your verification code for registration is:</p>
            
            <div style="background-color: #0a0a0a; color: #00fffc; 
                        font-size: 32px; font-weight: bold; 
                        letter-spacing: 5px; padding: 15px; 
                        margin: 20px 0; text-align: center;
                        border-radius: 8px;">
              ${otp}
            </div>
            
            <p style="font-size: 14px; color: #666;">
              This code is valid for 5 minutes. Please do not share it with anyone.
            </p>
            
            <p style="font-size: 14px; color: #666;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
          
          <div style="background-color: #0a0a0a; padding: 15px; text-align: center; font-size: 12px; color: #aaa;">
            © ${new Date().getFullYear()} Your App Name. All rights reserved.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = sendOtpEmail;