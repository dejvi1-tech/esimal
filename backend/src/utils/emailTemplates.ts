import { config } from 'dotenv';
import { QRCodeService } from '../services/qrCodeService';

// Load environment variables
config();

interface EmailTemplateData {
  orderId?: string;
  packageName?: string;
  amount?: number;
  dataAmount?: string;
  validityDays?: number;
  esimCode?: string;
  qrCodeData?: string;
  isGuestOrder?: boolean;
  signupUrl?: string;
  dashboardUrl?: string;
  resetUrl?: string;
  verificationUrl?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  loginUrl?: string;
  orderNumber?: string;
  iccid?: string;
  paymentUrl?: string;
  isRefunded?: boolean;
  qrCodeUrl?: string;
  // Payment-related fields
  paymentIntentId?: string;
  failureReason?: string;
  retryUrl?: string;
  refundId?: string;
  name?: string;
  surname?: string;
}

interface EmailTemplate {
  subject: string;
  html: (data: EmailTemplateData) => string | Promise<string>;
}

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .button { 
      display: inline-block;
      padding: 12px 24px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .code { 
      font-family: monospace;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      font-size: 16px;
      border: 1px solid #ddd;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .qr-code img {
      max-width: 200px;
      height: auto;
    }
    .order-details {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .order-details h3 {
      margin-top: 0;
      color: #007bff;
    }
    .order-details ul {
      list-style: none;
      padding: 0;
    }
    .order-details li {
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .order-details li:last-child {
      border-bottom: none;
    }
    .activation-steps {
      background: #e8f5e8;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .activation-steps h3 {
      margin-top: 0;
      color: #28a745;
    }
    .activation-steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>eSIM Marketplace</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply directly to this email.</p>
      <p>&copy; ${new Date().getFullYear()} eSIM Marketplace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates: Record<string, EmailTemplate> = {
  orderConfirmation: {
    subject: 'eSIM juaj është gati! - Konfirmimi i porosisë',
    html: async (data: EmailTemplateData): Promise<string> => {
      // Use the real LPA format QR code data from Roamify
      const lpaData = data.qrCodeData || QRCodeService.generateLPAData(data.esimCode || '', data.packageName || '');
      
      // Generate QR code as data URL for email embedding
      let qrCodeDataUrl = '';
      try {
        if (data.qrCodeUrl) {
          qrCodeDataUrl = data.qrCodeUrl;
        } else {
          qrCodeDataUrl = await QRCodeService.generateQRCodeDataURL(
            data.esimCode || '', 
            data.packageName || ''
          );
        }
      } catch (error) {
        qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(lpaData)}`;
      }

      // Compose the greeting
      const greetingName = data.firstName ? data.firstName : '';
      
      return baseTemplate(`
        <p>Përshëndetje ${greetingName},</p>
        <p>Bashkangjitur mund të gjeni barkodin për të aktivizuar kartën tuaj eSIM me <a href="https://esimfly.al" style="color: #b59f3b; font-weight: bold; text-decoration: underline;">esimfly.al</a></p>
        <div class="qr-code">
          <img src="${qrCodeDataUrl}" alt="eSIM QR Code" style="max-width: 300px; height: auto;" />
        </div>
        <p><strong>Nr. eSim:</strong> ${data.iccid || data.esimCode || ''}</p>
        <h3 style="color: #b59f3b;">👇 Si ta instaloni 👇</h3>
        <p><strong>Iphone:</strong> Mbajeni shtypur foton e barkodit dy sekonda, deri sa t'ju dal opsioni <b>"Add eSIM"</b> (funksionon me iOS 17.4 e sipër).</p>
        <p>Nëse nuk ju del &gt; <b>skanoni kodin QR</b> me kameran e celularit ose duke shkuar tek Settings &gt; Mobile Service (ose cellular) &gt; Add eSIM.</p>
      `);
    },
  },

  // Payment Success Template
  paymentSuccess: {
    subject: 'Payment Successful - Your eSIM Order',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>✅ Payment Successful!</h2>
      <p>Great news! Your payment has been processed successfully and your eSIM order is being prepared.</p>
      
      <div class="order-details">
        <h3>📋 Payment Details:</h3>
        <ul>
          <li><strong>Order ID:</strong> ${data.orderId}</li>
          <li><strong>Package:</strong> ${data.packageName}</li>
          <li><strong>Amount Paid:</strong> $${data.amount}</li>
          <li><strong>Payment ID:</strong> ${data.paymentIntentId}</li>
        </ul>
      </div>

      <p>Your eSIM package is being activated and you will receive a separate email with your activation details shortly.</p>
      
      <p>If you don't receive the activation email within 5 minutes, please check your spam folder or contact our support team.</p>
      
      <a href="${data.dashboardUrl}" class="button">View Order Status</a>
    `),
  },

  // Payment Failed Template
  paymentFailed: {
    subject: 'Payment Failed - Action Required',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>❌ Payment Failed</h2>
      <p>We're sorry, but your payment could not be processed. Here are the details:</p>
      
      <div class="order-details">
        <h3>📋 Payment Details:</h3>
        <ul>
          <li><strong>Package:</strong> ${data.packageName}</li>
          <li><strong>Amount:</strong> $${data.amount}</li>
          <li><strong>Failure Reason:</strong> ${data.failureReason}</li>
        </ul>
      </div>

      <h3>🔧 What You Can Do:</h3>
      <ul>
        <li>Check that your payment method details are correct</li>
        <li>Ensure you have sufficient funds available</li>
        <li>Try using a different payment method</li>
        <li>Contact your bank if the issue persists</li>
      </ul>

      <p>You can retry your payment by clicking the button below:</p>
      <a href="${data.retryUrl}" class="button">Retry Payment</a>

      <p>If you continue to experience issues, please contact our support team for assistance.</p>
    `),
  },

  // Payment Canceled Template
  paymentCanceled: {
    subject: 'Payment Canceled - Your eSIM Order',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>🚫 Payment Canceled</h2>
      <p>Your payment was canceled. No charges have been made to your account.</p>
      
      <div class="order-details">
        <h3>📋 Order Details:</h3>
        <ul>
          <li><strong>Package:</strong> ${data.packageName}</li>
          <li><strong>Amount:</strong> $${data.amount}</li>
        </ul>
      </div>

      <p>If you'd like to complete your purchase, you can retry your payment:</p>
      <a href="${data.retryUrl}" class="button">Retry Payment</a>

      <p>If you have any questions or need assistance, please contact our support team.</p>
    `),
  },

  // Refund Processed Template
  refundProcessed: {
    subject: 'Refund Processed - eSIM Marketplace',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>💰 Refund Processed</h2>
      <p>Your refund has been successfully processed and will be credited back to your original payment method.</p>
      
      <div class="order-details">
        <h3>📋 Refund Details:</h3>
        <ul>
          <li><strong>Order ID:</strong> ${data.orderId}</li>
          <li><strong>Refund Amount:</strong> $${data.amount}</li>
          <li><strong>Refund ID:</strong> ${data.refundId}</li>
          <li><strong>Processed Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
      </div>

      <h3>⏱️ Refund Timeline:</h3>
      <ul>
        <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
        <li><strong>Bank Transfers:</strong> 3-5 business days</li>
        <li><strong>Digital Wallets:</strong> 1-3 business days</li>
      </ul>

      <p>You will receive a separate confirmation from your payment provider once the refund is completed.</p>
      
      <p>If you have any questions about your refund, please contact our support team.</p>
    `),
  },

  passwordReset: {
    subject: 'Password Reset - eSIM Marketplace',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      
      <a href="${data.resetUrl}" class="button">Reset Password</a>
      
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
    `),
  },

  accountVerification: {
    subject: 'Verify Your Email - eSIM Marketplace',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>Welcome to eSIM Marketplace!</h2>
      <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
      
      <a href="${data.verificationUrl}" class="button">Verify Email</a>
      
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    `),
  },

  orderCancellation: {
    subject: 'Order Cancelled - eSIM Marketplace',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>Order Cancellation Confirmation</h2>
      <p>Your order has been ${data.isRefunded ? 'cancelled and refunded' : 'cancelled'}.</p>
      
      <h3>Order Details:</h3>
      <ul>
        <li>Order ID: ${data.orderId}</li>
        <li>Package: ${data.packageName}</li>
        <li>Amount: $${data.amount}</li>
        ${data.isRefunded ? `<li>Refund Amount: $${data.amount}</li>` : ''}
      </ul>

      ${data.isRefunded ? `
        <p>The refund has been processed and should appear in your account within 5-7 business days.</p>
      ` : `
        <p>This order was not eligible for a refund as it was cancelled after the refund period.</p>
      `}

      <p>If you have any questions, please contact our support team.</p>
    `),
  },

  accountCreated: {
    subject: 'Account Created - eSIM Marketplace',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>Welcome to eSIM Marketplace!</h2>
      <p>Your account has been successfully created.</p>
      
      <h3>Account Details:</h3>
      <ul>
        <li>Email: ${data.email}</li>
        <li>Name: ${data.firstName} ${data.lastName}</li>
      </ul>

      <p>You can now log in to your account and manage your eSIMs.</p>
      <a href="${data.loginUrl}" class="button">Log In</a>
    `),
  },

  topupOrderConfirmation: {
    subject: 'Top-Up Order Confirmation - eSIM Marketplace',
    html: (data: EmailTemplateData) => baseTemplate(`
      <h2>Top-Up Order Confirmation</h2>
      <p>Thank you for your top-up order!</p>
      
      <h3>Order Details:</h3>
      <ul>
        <li>Order ID: ${data.orderNumber}</li>
        <li>ICCID: ${data.iccid}</li>
        <li>Package: ${data.packageName}</li>
        <li>Amount: $${data.amount}</li>
        <li>Data: ${data.dataAmount}</li>
        <li>Validity: ${data.validityDays} days</li>
      </ul>

      <p>To complete your top-up, please click the button below to proceed with payment:</p>
      <a href="${data.paymentUrl}" class="button">Complete Payment</a>

      <p>If you have any questions, please contact our support team.</p>
    `),
  },
}; 