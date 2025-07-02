const nodemailer = require('nodemailer');

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,          // e.g., smtp.gmail.com
      port: 587,                             // REQUIRED for TLS (STARTTLS)
      secure: false,                         // false for port 587
      auth: {
        user: process.env.MAIL_USER,        // your Gmail address
        pass: process.env.MAIL_PASS,        // app password
      },
    });

    let info = await transporter.sendMail({
      from: `"Chatbot" <${process.env.MAIL_USER}>`, // Use verified sender
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = mailSender;
