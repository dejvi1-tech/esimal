const { sendEmail } = require('./src/services/emailService');
const { emailTemplates } = require('./src/utils/emailTemplates');

async function testEmail() {
  console.log('Testing email service...');
  
  try {
    await sendEmail({
      to: 'dejvikacollja@gmail.com',
      subject: 'Test Email - eSIM Order',
      html: async () => emailTemplates.orderConfirmation.html({
        orderId: 'test-order-123',
        amount: 2.49,
        packageName: 'Test eSIM Package',
        dataAmount: '1GB',
        validity_days: 30,
        esimCode: 'TEST-ESIM-1234',
        qrCodeData: 'LPA:1$test.example.com$test-code',
        qrCodeUrl: '',
        isGuestOrder: true,
        signupUrl: 'https://esimfly.al/signup',
        dashboardUrl: 'https://esimfly.al/dashboard',
        name: 'Dejvi',
        surname: 'Kacollja',
        email: 'dejvikacollja@gmail.com',
      }),
    });
    
    console.log('✅ Test email sent successfully!');
    
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    console.error('Full error:', error);
  }
}

testEmail(); 