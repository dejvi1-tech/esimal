# Email Configuration Testing Guide

This guide will help you test your email configuration for the eSIM Marketplace application.

## 📧 Required Environment Variables

Make sure you have these variables in your `.env` file:

```env
# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password_or_app_password
SMTP_FROM=your_email@example.com
```

## 🧪 Testing Your Email Configuration

### Option 1: Simple Email Test (Recommended for quick testing)

```bash
# Test with your email address
npm run test:email:simple your-email@example.com

# Or use default test email
npm run test:email:simple
```

### Option 2: Comprehensive Email Test

```bash
# Test all email templates and functionality
npm run test:email your-email@example.com
```

## 📋 Email Provider Configurations

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-gmail@gmail.com
```

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password (not your regular password)
3. Use the App Password in SMTP_PASS

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@yahoo.com
```

### Mailtrap (for testing)
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
SMTP_FROM=noreply@yourdomain.com
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=your-verified-sender@yourdomain.com
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
SMTP_FROM=your-verified-email@yourdomain.com
```

## 🔧 Troubleshooting Common Issues

### 1. Authentication Failed
**Error:** `Invalid login: 535 5.7.0 Authentication failed`

**Solutions:**
- Check if your email provider requires an App Password
- Verify your username and password are correct
- Ensure 2-factor authentication is enabled (for Gmail)
- Check if your email provider allows SMTP access

### 2. Connection Timeout
**Error:** `Connection timeout` or `ENOTFOUND`

**Solutions:**
- Verify the SMTP host is correct
- Check if the port is correct (587 for TLS, 465 for SSL)
- Ensure your firewall isn't blocking the connection
- Try different ports (587, 465, 25)

### 3. Rate Limiting
**Error:** `The email limit is reached`

**Solutions:**
- Check your email provider's sending limits
- Upgrade your plan if needed
- Implement rate limiting in your application
- Use a dedicated email service like SendGrid or AWS SES

### 4. SSL/TLS Issues
**Error:** `SSL/TLS connection failed`

**Solutions:**
- Set `SMTP_SECURE=false` for port 587 (STARTTLS)
- Set `SMTP_SECURE=true` for port 465 (SSL)
- Try different port combinations

## 📊 Test Results Interpretation

### ✅ Successful Test
```
🧪 Email Configuration Test Suite

📧 Test email address: your-email@example.com

✅ Email configuration loaded successfully
🔍 Testing SMTP connection...
Host: smtp.gmail.com
Port: 587
Secure: false
User: your-email@gmail.com
From: your-email@gmail.com
✅ SMTP connection verified successfully

📧 Testing email sending...

1. Testing simple text email...
✅ Simple text email sent successfully

2. Testing order confirmation email...
✅ Order confirmation email sent successfully

🎉 Email configuration test completed successfully!

📋 Summary:
✅ SMTP connection verified
✅ Email templates working
✅ Rate limiting tested

📧 Check your email inbox for test messages
```

### ❌ Failed Test
```
❌ Email sending failed: Invalid login: 535 5.7.0 Authentication failed

🔧 Troubleshooting tips:
1. Check your .env file has all required SMTP settings
2. Verify your SMTP credentials are correct
3. Check if your email provider requires app passwords
4. Ensure your email provider allows SMTP access
```

## 🚀 Production Recommendations

### For Production Use:
1. **Use a dedicated email service** like SendGrid, AWS SES, or Mailgun
2. **Set up proper SPF, DKIM, and DMARC records** for your domain
3. **Monitor email delivery rates** and bounce rates
4. **Implement email queuing** for high-volume sending
5. **Set up email templates** for consistent branding

### Security Best Practices:
1. **Never commit email credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor for suspicious activity**
5. **Implement rate limiting** to prevent abuse

## 📞 Support

If you're still having issues after trying these solutions:

1. Check your email provider's documentation
2. Verify your email provider's SMTP settings
3. Test with a different email provider
4. Check the application logs for detailed error messages
5. Consider using a dedicated email service for production

## 🎯 Quick Test Checklist

- [ ] Environment variables are set correctly
- [ ] SMTP credentials are valid
- [ ] Email provider allows SMTP access
- [ ] Firewall/network allows SMTP connections
- [ ] Test email is received in inbox
- [ ] Email templates render correctly
- [ ] Rate limiting is working
- [ ] Error handling is working 