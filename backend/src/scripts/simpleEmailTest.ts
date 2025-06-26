import { config } from 'dotenv';
import { sendEmail } from '../services/emailService';

// Load environment variables
config();

const testSimpleEmail = async (): Promise<void> => {
  const testEmail = process.argv[2] || 'test@example.com';
  
  console.log('🧪 Simple Email Test');
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log('📋 Email configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST || 'Not set'}`);
  console.log(`   Port: ${process.env.SMTP_PORT || '587'}`);
  console.log(`   User: ${process.env.SMTP_USER || 'Not set'}`);
  console.log(`   From: ${process.env.SMTP_FROM || process.env.SMTP_USER || 'Not set'}`);
  console.log('');

  try {
    await sendEmail({
      to: testEmail,
      subject: 'Test Email - eSIM Marketplace',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>SMTP User: ${process.env.SMTP_USER}</li>
        </ul>
        <p>If you received this email, your email configuration is working! 🎉</p>
      `,
    });
    
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
testSimpleEmail().catch(console.error); 