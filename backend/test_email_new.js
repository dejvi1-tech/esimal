const { config } = require('dotenv');
const { sendEmail } = require('./src/services/emailService.ts');

// Load environment variables
config();

console.log('NEW TEST - ENV:', {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_FROM: process.env.SMTP_FROM,
});

console.log('NEW TEST - sendEmail function:', typeof sendEmail);

const testEmail = process.argv[2] || 'info@esimfly.al';

async function testEmailNew() {
  console.log('🧪 New Email Test');
  console.log(`📧 Sending test email to: ${testEmail}`);
  
  try {
    console.log('DEBUG - About to call sendEmail...');
    await sendEmail({
      to: testEmail,
      subject: 'New Test Email - eSIM Marketplace',
      html: `
        <h2>New Test Email</h2>
        <p>This is a new test email to verify your email configuration is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, your email configuration is working! 🎉</p>
      `,
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Check your inbox for the test email.');
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
}

testEmailNew().catch(console.error); 