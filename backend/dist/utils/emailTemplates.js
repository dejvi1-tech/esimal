"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = void 0;
const dotenv_1 = require("dotenv");
const qrCodeService_1 = require("../services/qrCodeService");
// Load environment variables
(0, dotenv_1.config)();
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Orbitron', 'Exo', Arial, sans-serif; line-height: 1.6; color: #fff; background: #4B0082; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: rgba(255,255,255,0.08); border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    .header { background: none; padding: 20px; text-align: center; }
    .header img { max-width: 180px; margin-bottom: 8px; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #e5e7eb; }
    .button { 
      display: inline-block;
      padding: 12px 24px;
      background-color: #fbbf24;
      color: #4B0082;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
      font-family: 'Orbitron', 'Exo', Arial, sans-serif;
    }
    .code { 
      font-family: monospace;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      font-size: 16px;
      border: 1px solid #ddd;
      color: #4B0082;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
      padding: 20px;
      background: rgba(255,255,255,0.08);
      border-radius: 8px;
    }
    .qr-code img {
      max-width: 200px;
      height: auto;
      border: 2px solid #fbbf24;
      border-radius: 12px;
      background: #fff;
    }
    .order-details {
      background: rgba(255,255,255,0.08);
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      color: #fff;
    }
    .order-details h3 {
      margin-top: 0;
      color: #fbbf24;
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
      color: #4B0082;
    }
    .activation-steps h3 {
      margin-top: 0;
      color: #fbbf24;
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
      <img src="https://esimfly.al/images/esimfly-logo.png" alt="esimfly logo" />
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply directly to this email.</p>
      <p>&copy; ${new Date().getFullYear()} esimfly. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
exports.emailTemplates = {
    orderConfirmation: {
        subject: 'eSIM juaj është gati! - Konfirmimi i porosisë',
        html: async (data) => {
            // Generate base64 QR code that embeds directly in email (no external URLs)
            let qrCodeDataUrl = '';
            console.log('[EMAIL TEMPLATE DEBUG] Email data received:', {
                hasQrCodeData: !!data.qrCodeData,
                qrCodeDataLength: data.qrCodeData ? data.qrCodeData.length : 0,
                qrCodeDataPreview: data.qrCodeData ? data.qrCodeData.substring(0, 50) + '...' : 'none',
                hasEsimCode: !!data.esimCode,
                esimCode: data.esimCode,
                hasOrderId: !!data.orderId,
                orderId: data.orderId,
                packageName: data.packageName,
                isRealRoamifyQR: data.qrCodeData && data.qrCodeData.includes('LPA:'),
            });
            try {
                // PRIORITY 1: Use real LPA code from Roamify (this should be the primary source)
                if (data.qrCodeData && data.qrCodeData !== '' && data.qrCodeData !== 'PENDING') {
                    console.log('[EMAIL TEMPLATE DEBUG] ✅ Using REAL QR code data from Roamify');
                    console.log('[EMAIL TEMPLATE DEBUG] Real QR data:', data.qrCodeData);
                    // PRIMARY: Use external QR code service for Gmail compatibility
                    const encodedData = encodeURIComponent(data.qrCodeData);
                    qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&margin=10&format=png`;
                    console.log('[EMAIL TEMPLATE DEBUG] ✅ Using external QR service for Gmail compatibility');
                    console.log('[EMAIL TEMPLATE DEBUG] QR URL:', qrCodeDataUrl);
                }
                else if (data.esimCode && data.esimCode !== 'PENDING' && data.esimCode !== '') {
                    // FALLBACK: Only use this if no real QR code data available
                    console.log('[EMAIL TEMPLATE DEBUG] ⚠️ Using FALLBACK eSIM code, no real QR data available');
                    console.log('[EMAIL TEMPLATE DEBUG] Fallback eSIM code:', data.esimCode);
                    const lpaData = qrCodeService_1.QRCodeService.generateLPAData(data.esimCode, data.packageName || '');
                    const encodedData = encodeURIComponent(lpaData);
                    qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&margin=10&format=png`;
                    console.log('[EMAIL TEMPLATE DEBUG] ⚠️ Generated external QR URL from FALLBACK data');
                }
                else {
                    // EMERGENCY FALLBACK: Generate placeholder QR code with order info
                    console.log('[EMAIL TEMPLATE DEBUG] ❌ Using EMERGENCY fallback - no valid data available');
                    let placeholderData;
                    if (data.orderId) {
                        placeholderData = `Order: ${data.orderId}\nPackage: ${data.packageName || 'eSIM Package'}\nContact support for activation`;
                    }
                    else {
                        placeholderData = `eSIM Package: ${data.packageName || 'eSIM'}\nContact support for activation`;
                    }
                    const encodedData = encodeURIComponent(placeholderData);
                    qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&margin=10&format=png`;
                    console.log('[EMAIL TEMPLATE DEBUG] ❌ Generated EMERGENCY PLACEHOLDER QR URL');
                }
            }
            catch (error) {
                console.error('❌ Error generating QR code for email:', error);
                // Emergency fallback: Use external service with basic data
                console.log('[EMAIL TEMPLATE DEBUG] 🚨 Using EXTERNAL emergency fallback due to error');
                const fallbackData = data.qrCodeData || data.esimCode || 'eSIM';
                const encodedData = encodeURIComponent(fallbackData);
                qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&margin=10&format=png`;
                console.log('[EMAIL TEMPLATE DEBUG] 🚨 External fallback URL:', qrCodeDataUrl);
            }
            console.log('[EMAIL TEMPLATE DEBUG] Final QR code result:', {
                qrCodeLength: qrCodeDataUrl.length,
                isExternal: qrCodeDataUrl.startsWith('http'),
                isGmailCompatible: qrCodeDataUrl.includes('qrserver.com'),
                preview: qrCodeDataUrl.substring(0, 100) + '...',
                usedRealData: !!(data.qrCodeData && data.qrCodeData !== '' && data.qrCodeData !== 'PENDING')
            });
            // Compose the greeting
            const greetingName = data.firstName || data.name || '';
            // Show the real eSIM ID instead of PENDING
            const esimId = data.iccid || data.esimCode || 'PENDING';
            return baseTemplate(`
        <p>Përshëndetje ${greetingName},</p>
        <p>Bashkangjitur mund të gjeni barkodin për të aktivizuar kartën tuaj eSIM me <a href="https://esimfly.al" style="color: #b59f3b; font-weight: bold; text-decoration: underline;">esimfly.al</a></p>
        <div class="qr-code">
          <img src="${qrCodeDataUrl}" alt="eSIM QR Code" width="300" height="300" style="display: block; max-width: 300px; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 0 auto;" />
        </div>
        <p><strong>Nr. eSim:</strong> ${esimId}</p>
        <h3 style="color: #b59f3b;">👇 Si ta instaloni 👇</h3>
        <p><strong>Iphone:</strong> Mbajeni shtypur foton e barkodit dy sekonda, deri sa t'ju dal opsioni <b>"Add eSIM"</b> (funksionon me iOS 17.4 e sipër).</p>
        <p>Nëse nuk ju dal &gt; <b>skanoni kodin QR</b> me kameran e celularit ose duke shkuar tek Settings &gt; Mobile Service (ose cellular) &gt; Add eSIM.</p>
      `);
        },
    },
    // Payment Success Template
    paymentSuccess: {
        subject: 'Payment Successful - Your eSIM Order',
        html: (data) => baseTemplate(`
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
        html: (data) => baseTemplate(`
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
        html: (data) => baseTemplate(`
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
        subject: 'Refund Processed - esimfly',
        html: (data) => baseTemplate(`
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
        subject: 'Password Reset - esimfly',
        html: (data) => baseTemplate(`
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Click the button below to reset it:</p>
      
      <a href="${data.resetUrl}" class="button">Reset Password</a>
      
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
    `),
    },
    accountVerification: {
        subject: 'Verify Your Email - esimfly',
        html: (data) => baseTemplate(`
      <h2>Welcome to esimfly!</h2>
      <p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
      
      <a href="${data.verificationUrl}" class="button">Verify Email</a>
      
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    `),
    },
    orderCancellation: {
        subject: 'Order Cancelled - esimfly',
        html: (data) => baseTemplate(`
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
        subject: 'Account Created - esimfly',
        html: (data) => baseTemplate(`
      <h2>Welcome to esimfly!</h2>
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
        subject: 'Top-Up Order Confirmation - esimfly',
        html: (data) => baseTemplate(`
      <h2>Top-Up Order Confirmation</h2>
      <p>Thank you for your top-up order!</p>
      
      <h3>Order Details:</h3>
      <ul>
        <li>Order ID: ${data.orderNumber}</li>
        <li>ICCID: ${data.iccid}</li>
        <li>Package: ${data.packageName}</li>
        <li>Amount: $${data.amount}</li>
        <li>Data: ${data.dataAmount}</li>
        <li>Validity: ${data.days} days</li>
      </ul>

      <p>To complete your top-up, please click the button below to proceed with payment:</p>
      <a href="${data.paymentUrl}" class="button">Complete Payment</a>

      <p>If you have any questions, please contact our support team.</p>
    `),
    },
    // NEW: Thank You Email Template (sent immediately after payment)
    thankYou: {
        subject: 'Thank you for your eSIM purchase!',
        html: (data) => baseTemplate(`
      <h2>🎉 Thank you for your purchase!</h2>
      <p>Hi ${data.name || 'there'},</p>
      <p>We're excited to confirm that your payment has been successfully processed and we're preparing your eSIM.</p>
      
      <div class="order-details">
        <h3>📋 Order Summary:</h3>
        <ul>
          <li><strong>Order ID:</strong> ${data.orderId}</li>
          <li><strong>Package:</strong> ${data.packageName}</li>
          <li><strong>Data Amount:</strong> ${data.dataAmount}</li>
          <li><strong>Validity:</strong> ${data.days} days</li>
          <li><strong>Amount Paid:</strong> $${data.amount}</li>
        </ul>
      </div>

      <div class="activation-steps">
        <h3>⏱️ What happens next?</h3>
        <p><strong>You'll receive a second email with your QR code and instructions within 5 minutes.</strong></p>
        <p>This email will contain everything you need to activate your eSIM, including:</p>
        <ul>
          <li>Your unique QR code for installation</li>
          <li>Step-by-step activation instructions</li>
          <li>Your eSIM activation code</li>
        </ul>
      </div>

      <p>If you don't receive the activation email within 5 minutes, please check your spam folder or contact our support team.</p>
      
      <p>Thank you for choosing esimfly!</p>
      
      ${data.dashboardUrl ? `<a href="${data.dashboardUrl}" class="button">View Order Status</a>` : ''}
    `),
    },
    // --- BEGIN: Branded Bilingual Order Confirmation Email ---
    orderConfirmationBranded: {
        subject: 'Konfirmim Porosie / Order Confirmation - esimfly',
        html: (data) => `
      <!DOCTYPE html>
      <html lang="sq">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Konfirmim Porosie / Order Confirmation</title>
        <style>
          body { 
            background: #4B0082; 
            color: #fff; 
            font-family: 'Orbitron', 'Exo', Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            line-height: 1.6;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.08); 
            border-radius: 18px; 
            box-shadow: 0 4px 16px rgba(0,0,0,0.1); 
            padding: 0;
            overflow: hidden;
          }
          .banner { 
            width: 100%; 
            max-width: 600px; 
            display: block; 
            margin: 0 auto; 
            border-radius: 18px 18px 0 0;
          }
          .content { 
            padding: 32px 24px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 32px; 
          }
          .logo { 
            max-width: 180px; 
            margin-bottom: 12px; 
          }
          .main-title { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 16px; 
            text-align: center;
          }
          .secondary-message {
            font-size: 18px;
            margin-bottom: 24px;
            text-align: center;
            padding: 24px 0;
          }
          .accent { 
            color: #fbbf24; 
            font-weight: bold; 
          }
          .section { 
            margin: 24px 0; 
            font-size: 18px;
          }
          .lang { 
            font-size: 16px; 
            margin-bottom: 18px; 
            font-weight: bold;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 16px;
          }
          .esim-info {
            padding: 24px 0;
            font-size: 18px;
            text-align: center;
            background: rgba(251,191,36,0.08);
            border-radius: 10px;
            margin: 24px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Full-width Banner -->
          <img src="https://esimfly.al/images/esimfly-logo.png" alt="esimfly banner" class="banner" />
          
          <div class="content">
            <!-- Bold thank you message -->
            <h1 class="main-title">Faleminderit për porosinë tuaj!</h1>
            
            <!-- Secondary message about receiving email with eSIM info -->
            <div class="secondary-message">
              Ju do të merrni një email tjetër me <span class="accent">të dhënat e eSIM</span> brenda pak minutash.
            </div>
            
            <!-- Personalized greeting with name -->
            <div class="greeting">
              Përshëndetje${data.firstName ? ' ' + data.firstName : ''},
            </div>
            
            <!-- Details about QR code in a second email -->
            <div class="esim-info">
              Në vijim ju do të merrni një email tjetër me barkodin për të aktivizuar kartën tuaj eSIM.
            </div>
            
            <!-- English Section -->
            <div class="lang">
              ENGLISH
            </div>
            <h1 class="main-title">Thank you for your order!</h1>
            <div class="secondary-message">
              You will receive another email with <span class="accent">your eSIM details</span> in a few minutes.
            </div>
            <div class="greeting">
              Hello${data.firstName ? ' ' + data.firstName : ''},
            </div>
            <div class="esim-info">
              Shortly, you will receive a separate email with the QR code to activate your eSIM card.
            </div>
          </div>
        </div>
        
        <!-- Bottom bar with blue background and white text -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #183A5A; margin-top: 20px;">
          <tr>
            <td align="center" style="color: white; font-size: 16px; padding: 20px; font-family: 'Orbitron', 'Exo', Arial, sans-serif;">
              Nëse keni pyetje, na kontaktoni duke i kthyer përgjigje këtij emaili.<br/>
              If you have questions, just reply to this email.<br/>
              <br/>
              <span style="font-size: 14px; color: #e5e7eb;">
                &copy; ${new Date().getFullYear()} esimfly.al
              </span>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
    },
    // --- END: Branded Bilingual Order Confirmation Email ---
    // --- BEGIN: Branded Bilingual eSIM Details Email ---
    esimDetailsBranded: {
        subject: 'Detajet e eSIM / Your eSIM Details - esimfly',
        html: (data) => `
      <!DOCTYPE html>
      <html lang="sq">
      <head>
        <meta charset="utf-8">
        <title>Detajet e eSIM / Your eSIM Details</title>
        <style>
          body { background: #4B0082; color: #fff; font-family: 'Orbitron', 'Exo', Arial, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.08); border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); padding: 32px 24px; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { max-width: 180px; margin-bottom: 12px; }
          .title { font-size: 1.7em; font-weight: bold; margin-bottom: 8px; }
          .accent { color: #fbbf24; font-weight: bold; }
          .section { margin: 24px 0; }
          .qr { text-align: center; margin: 24px 0; }
          .qr img { max-width: 220px; border-radius: 12px; border: 2px solid #fbbf24; background: #fff; }
          .footer { text-align: center; font-size: 12px; color: #e5e7eb; margin-top: 32px; }
          .lang { font-size: 0.95em; margin-bottom: 18px; }
          .steps { background: rgba(251,191,36,0.08); border-radius: 10px; padding: 16px; margin: 18px 0; color: #fff; }
          .steps-title { color: #fbbf24; font-weight: bold; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://esimfly.al/images/esimfly-logo.png" alt="esimfly logo" class="logo" />
          </div>
          <div class="lang"><b>ALBANIAN</b></div>
          <div class="title">Detajet e eSIM tuaj</div>
          <div class="section">
            Përshëndetje${data.firstName ? ' ' + data.firstName : ''},<br/>
            Më poshtë gjeni barkodin për të aktivizuar kartën tuaj eSIM.<br/>
          </div>
          <div class="qr">
            <img src="${data.qrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ESIM_PLACEHOLDER'}" alt="eSIM QR Code" />
          </div>
          <div class="section"><b>Nr. eSIM:</b> ${data.iccid || data.esimCode || 'PENDING'}</div>
          <div class="steps">
            <div class="steps-title">Si ta instaloni:</div>
            <ul>
              <li><b>iPhone:</b> Mbajeni shtypur foton e barkodit dy sekonda, deri sa t'ju dal opsioni "Add eSIM" (iOS 17.4+).</li>
              <li>Nëse nuk ju del, skanoni kodin QR me kameran ose shkoni tek Settings &gt; Mobile Service &gt; Add eSIM.</li>
            </ul>
          </div>
          <div class="lang"><b>ENGLISH</b></div>
          <div class="title">Your eSIM Details</div>
          <div class="section">
            Hello${data.firstName ? ' ' + data.firstName : ''},<br/>
            Below is your QR code to activate your eSIM card.<br/>
          </div>
          <div class="qr">
            <img src="${data.qrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ESIM_PLACEHOLDER'}" alt="eSIM QR Code" />
          </div>
          <div class="section"><b>eSIM Number:</b> ${data.iccid || data.esimCode || 'PENDING'}</div>
          <div class="steps">
            <div class="steps-title">How to install:</div>
            <ul>
              <li><b>iPhone:</b> Long-press the QR code image for 2 seconds until "Add eSIM" appears (iOS 17.4+).</li>
              <li>If not, scan the QR code with your camera or go to Settings &gt; Mobile Service &gt; Add eSIM.</li>
            </ul>
          </div>
          <div class="footer">
            Nëse keni pyetje, na kontaktoni duke kthyer përgjigje këtij emaili.<br/>
            If you have questions, just reply to this email.<br/>
            <br/>
            Nëse nuk doni të merrni email-e prej nesh, <a href="#" style="color:#fbbf24;">çregjistrohuni këtu</a>.<br/>
            If you wish to unsubscribe, <a href="#" style="color:#fbbf24;">unsubscribe here</a>.<br/>
            <br/>
            &copy; ${new Date().getFullYear()} esimfly.al
          </div>
        </div>
      </body>
      </html>
    `
    },
    // --- END: Branded Bilingual eSIM Details Email ---
};
//# sourceMappingURL=emailTemplates.js.map