const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('DIRECT TEST - ENV:', {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_FROM: process.env.SMTP_FROM,
});

const testEmail = process.argv[2] || 'info@esimfly.al';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('DIRECT TEST - TRANSPORTER CONFIG:', transporter.options);

transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ SMTP connection failed:', error);
  } else {
    console.log('✅ SMTP connection verified successfully!');
    
    // Try to send an email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: testEmail,
      subject: 'Direct Test Email - eSIM Marketplace',
      html: `
        <h2>Direct Test Email</h2>
        <p>This is a direct test email to verify your email configuration is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, your email configuration is working! 🎉</p>
      `,
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.error('❌ Email sending failed:', error);
      } else {
        console.log('✅ Email sent successfully!');
        console.log('📧 Check your inbox for the test email.');
      }
    });
  }
}); 