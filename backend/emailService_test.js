const nodemailer = require('nodemailer');
const { config } = require('dotenv');

// Load environment variables
config();

// Create transporter dynamically to ensure environment variables are loaded
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log('DEBUG TRANSPORTER CREATION:', {
    host,
    port,
    secure,
    user,
  });

  if (!host || !user || !pass) {
    throw new Error('Missing required SMTP configuration');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      ...options,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail }; 