const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || `"Voltra" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            text,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Email error:', error);
        throw new Error('Failed to send email. Please try again later.');
    }
};

// Send verification OTP
const sendVerificationOTP = async (email, otp, name) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px; }
        .otp { font-size: 36px; font-weight: bold; color: #C9502F; text-align: center; padding: 20px; background: #f8f8f8; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
        .message { font-size: 16px; line-height: 1.6; color: #333; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
        .expiry { font-size: 14px; color: #888; text-align: center; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VOLTRA</div>
        </div>
        <h2 style="text-align: center; color: #1a1a1a;">Verify Your Email</h2>
        <p class="message">Hello ${name || 'User'},</p>
        <p class="message">Thank you for registering with Voltra. Please use the following OTP to verify your email address:</p>
        <div class="otp">${otp}</div>
        <p class="message">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p class="message">If you didn't request this, please ignore this email.</p>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Voltra. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: 'Verify Your Voltra Account - OTP',
        html,
    });
};

// Send password reset OTP
const sendResetPasswordOTP = async (email, otp, name) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px; }
        .otp { font-size: 36px; font-weight: bold; color: #C9502F; text-align: center; padding: 20px; background: #f8f8f8; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
        .message { font-size: 16px; line-height: 1.6; color: #333; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
        .expiry { font-size: 14px; color: #888; text-align: center; margin-top: 10px; }
        .warning { background: #fff3cd; padding: 10px; border-radius: 8px; margin: 20px 0; }
        .warning p { margin: 0; color: #856404; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VOLTRA</div>
        </div>
        <h2 style="text-align: center; color: #1a1a1a;">Reset Your Password</h2>
        <p class="message">Hello ${name || 'User'},</p>
        <p class="message">We received a request to reset your password. Use the following OTP to proceed:</p>
        <div class="otp">${otp}</div>
        <p class="message">This OTP is valid for <strong>10 minutes</strong>.</p>
        <div class="warning">
          <p>⚠️ If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Voltra. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: 'Reset Your Voltra Password - OTP',
        html,
    });
};

module.exports = {
    sendEmail,
    sendVerificationOTP,
    sendResetPasswordOTP,
};