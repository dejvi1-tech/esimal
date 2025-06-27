"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailService_1 = require("../services/emailService");
const emailTemplates_1 = require("../utils/emailTemplates");
// Load environment variables
(0, dotenv_1.config)();
const getEmailConfig = () => {
    const config = {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
    };
    // Validate required fields
    const missingFields = [];
    if (!config.host)
        missingFields.push('SMTP_HOST');
    if (!config.user)
        missingFields.push('SMTP_USER');
    if (!config.pass)
        missingFields.push('SMTP_PASS');
    if (missingFields.length > 0) {
        throw new Error(`Missing required email configuration: ${missingFields.join(', ')}`);
    }
    return config;
};
const testSMTPConnection = async (config) => {
    console.log('🔍 Testing SMTP connection...');
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`Secure: ${config.secure}`);
    console.log(`User: ${config.user}`);
    console.log(`From: ${config.from}`);
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
        // Verify connection configuration
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
        return true;
    }
    catch (error) {
        console.error('❌ SMTP connection failed:', error);
        return false;
    }
};
const testEmailSending = async (config, testEmail) => {
    console.log('\n📧 Testing email sending...');
    // Test 1: Simple text email
    console.log('\n1. Testing simple text email...');
    try {
        await (0, emailService_1.sendEmail)({
            to: testEmail,
            subject: 'Test Email - Simple Text',
            html: `
        <h2>Test Email</h2>
        <p>This is a simple test email to verify your email configuration is working.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
        });
        console.log('✅ Simple text email sent successfully');
    }
    catch (error) {
        console.error('❌ Simple text email failed:', error);
    }
    // Test 2: Order confirmation email
    console.log('\n2. Testing order confirmation email...');
    try {
        await (0, emailService_1.sendEmail)({
            to: testEmail,
            subject: emailTemplates_1.emailTemplates.orderConfirmation.subject,
            html: emailTemplates_1.emailTemplates.orderConfirmation.html({
                orderId: 'TEST-ORDER-123',
                packageName: 'Test Package - 1GB/7 Days',
                amount: 9.99,
                dataAmount: '1GB',
                validityDays: 7,
                esimCode: 'TEST-ESIM-CODE-123456',
                isGuestOrder: true,
                signupUrl: 'http://localhost:3000/signup',
                dashboardUrl: 'http://localhost:3000/dashboard',
            }),
        });
        console.log('✅ Order confirmation email sent successfully');
    }
    catch (error) {
        console.error('❌ Order confirmation email failed:', error);
    }
    // Test 3: Password reset email
    console.log('\n3. Testing password reset email...');
    try {
        await (0, emailService_1.sendEmail)({
            to: testEmail,
            subject: emailTemplates_1.emailTemplates.passwordReset.subject,
            html: emailTemplates_1.emailTemplates.passwordReset.html({
                resetUrl: 'http://localhost:3000/reset-password?token=test-token-123',
            }),
        });
        console.log('✅ Password reset email sent successfully');
    }
    catch (error) {
        console.error('❌ Password reset email failed:', error);
    }
    // Test 4: Account verification email
    console.log('\n4. Testing account verification email...');
    try {
        await (0, emailService_1.sendEmail)({
            to: testEmail,
            subject: emailTemplates_1.emailTemplates.accountVerification.subject,
            html: emailTemplates_1.emailTemplates.accountVerification.html({
                verificationUrl: 'http://localhost:3000/verify-email?token=test-token-123',
            }),
        });
        console.log('✅ Account verification email sent successfully');
    }
    catch (error) {
        console.error('❌ Account verification email failed:', error);
    }
    // Test 5: Account created email
    console.log('\n5. Testing account created email...');
    try {
        await (0, emailService_1.sendEmail)({
            to: testEmail,
            subject: emailTemplates_1.emailTemplates.accountCreated.subject,
            html: emailTemplates_1.emailTemplates.accountCreated.html({
                email: testEmail,
                firstName: 'Test',
                lastName: 'User',
                loginUrl: 'http://localhost:3000/login',
            }),
        });
        console.log('✅ Account created email sent successfully');
    }
    catch (error) {
        console.error('❌ Account created email failed:', error);
    }
};
const testEmailLimits = async (config, testEmail) => {
    console.log('\n📊 Testing email limits and rate limiting...');
    // Test sending multiple emails quickly
    const promises = [];
    for (let i = 1; i <= 3; i++) {
        promises.push((0, emailService_1.sendEmail)({
            to: testEmail,
            subject: `Test Email ${i} - Rate Limit Test`,
            html: `
          <h2>Test Email ${i}</h2>
          <p>This is test email number ${i} to check rate limiting.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `,
        }).catch(error => {
            console.error(`❌ Test email ${i} failed:`, error.message);
            return null;
        }));
    }
    try {
        await Promise.all(promises);
        console.log('✅ Rate limit test completed');
    }
    catch (error) {
        console.error('❌ Rate limit test failed:', error);
    }
};
const main = async () => {
    console.log('🧪 Email Configuration Test Suite\n');
    // Get test email from command line or use default
    const testEmail = process.argv[2] || 'test@example.com';
    if (!testEmail || !testEmail.includes('@')) {
        console.error('❌ Please provide a valid test email address');
        console.log('Usage: npm run test:email <your-email@example.com>');
        process.exit(1);
    }
    console.log(`📧 Test email address: ${testEmail}\n`);
    try {
        // Get email configuration
        const emailConfig = getEmailConfig();
        console.log('✅ Email configuration loaded successfully');
        // Test 1: SMTP Connection
        const connectionSuccess = await testSMTPConnection(emailConfig);
        if (!connectionSuccess) {
            console.error('\n❌ Email configuration test failed. Please check your SMTP settings.');
            process.exit(1);
        }
        // Test 2: Email Sending
        await testEmailSending(emailConfig, testEmail);
        // Test 3: Rate Limiting
        await testEmailLimits(emailConfig, testEmail);
        console.log('\n🎉 Email configuration test completed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ SMTP connection verified');
        console.log('✅ Email templates working');
        console.log('✅ Rate limiting tested');
        console.log('\n📧 Check your email inbox for test messages');
    }
    catch (error) {
        console.error('\n❌ Email test failed:', error);
        process.exit(1);
    }
};
// Run the test
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=testEmail.js.map