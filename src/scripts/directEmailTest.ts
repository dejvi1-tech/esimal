import { config } from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';

// Load environment variables from the correct path
config({ path: path.resolve(__dirname, '../../.env') });

// Debug print for environment variables
console.log('DIRECT TS TEST - ENV:', {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_FROM: process.env.SMTP_FROM,
});

// Create transporter directly in this script
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log('DIRECT TS TEST - TRANSPORTER CREATION:', {
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

const testDirectEmail = async (): Promise<void> => {
  const testEmail = process.argv[2] || 'info@esimfly.al';
  
  console.log('🧪 Direct TypeScript Email Test');
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log('📋 Email configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST || 'Not set'}`);
  console.log(`   Port: ${process.env.SMTP_PORT || '587'}`);
  console.log(`   User: ${process.env.SMTP_USER || 'Not set'}`);
  console.log(`   From: ${process.env.SMTP_FROM || process.env.SMTP_USER || 'Not set'}`);
  console.log('');

  try {
    console.log('DEBUG - Creating transporter...');
    const transporter = createTransporter();
    
    console.log('DEBUG - About to send email...');
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: 'Direct TypeScript Test Email - eSIM Marketplace',
      html: `
        <h2>Direct TypeScript Test Email</h2>
        <p>This is a direct TypeScript test email to verify your email configuration is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>SMTP User: ${process.env.SMTP_USER}</li>
        </ul>
        <p>If you received this email, your email configuration is working! 🎉</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Check your inbox for the test email.');
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your .env file has all required SMTP settings');
    console.log('2. Verify your SMTP credentials are correct');
    console.log('3. Check if your email provider requires app passwords');
    console.log('4. Ensure your email provider allows SMTP access');
  }
};

// Run the test
testDirectEmail().catch(console.error); 