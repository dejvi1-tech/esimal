# Email Order Flow Guide

This guide explains how the eSIM order flow works with automatic email notifications and QR codes.

## 🎯 **How It Works**

When a user buys an eSIM package, the system automatically:

1. **Creates an order** in the database
2. **Generates a unique eSIM code** for activation
3. **Creates a QR code** for easy device setup
4. **Sends a confirmation email** with:
   - Order details
   - eSIM activation code
   - QR code for scanning
   - Step-by-step activation instructions

## 📧 **Email Features**

### **Order Confirmation Email Includes:**
- ✅ **Order details** (ID, package, amount, data, validity)
- ✅ **eSIM activation code** (manual entry)
- ✅ **QR code** (scan with device)
- ✅ **Step-by-step activation instructions**
- ✅ **Important notes** about usage
- ✅ **Account creation link** (for guest orders)
- ✅ **Professional styling** with your branding

### **Email Template Features:**
- 📱 **Mobile-friendly design**
- 🎨 **Professional styling**
- 🔗 **QR code generation** using external API
- 📋 **Clear activation instructions**
- 💡 **Helpful tips and notes**

## 🧪 **Testing the Complete Flow**

### **Option 1: Quick Test (Recommended)**
```bash
cd backend
npm run test:order your-email@example.com
```

### **Option 2: Manual Test**
```bash
# Start your backend server
npm run dev

# In another terminal, run the test
node test_order_flow.js your-email@example.com
```

### **Option 3: Frontend Integration Test**
1. Start your frontend: `cd frontend && npm run dev`
2. Go to your website
3. Find a package and click "Buy Now"
4. Enter your email address
5. Check your inbox for the confirmation email

## 🔧 **API Endpoints**

### **Create Order for My Packages**
```http
POST /api/orders/my-packages
Content-Type: application/json

{
  "packageId": "package-uuid",
  "userEmail": "user@example.com",
  "userName": "User Name"
}
```

### **Response**
```json
{
  "status": "success",
  "message": "Order created successfully",
  "data": {
    "orderId": "order-uuid",
    "esimCode": "ESIM-XXXX-XXXX-XXXX",
    "qrCodeData": "LPA:1$esimfly.al$ESIM-XXXX-XXXX-XXXX$Package Name",
    "packageName": "1GB Europe - 7 Days",
    "amount": 9.99,
    "dataAmount": 1,
    "validityDays": 7
  }
}
```

## 📱 **QR Code Generation**

The system generates QR codes using the format:
```
LPA:1$esimfly.al$ESIM-CODE$PACKAGE-NAME
```

This creates a QR code that devices can scan to automatically configure the eSIM.

## 🎨 **Email Template Customization**

You can customize the email template in `src/utils/emailTemplates.ts`:

- **Colors and styling** in the CSS section
- **Content and messaging** in the HTML templates
- **QR code size and format** in the orderConfirmation template
- **Branding and logos** by adding images

## 🔍 **Troubleshooting**

### **Email Not Sending**
1. Check your SMTP configuration in `.env`
2. Test email configuration: `npm run test:email:simple your-email@example.com`
3. Check server logs for email errors

### **QR Code Not Working**
1. Verify the QR code data format
2. Test with different devices
3. Check if the QR code API is accessible

### **Order Creation Fails**
1. Check database connection
2. Verify package exists in `my_packages` table
3. Check server logs for errors

## 📊 **Database Schema**

The system uses these tables:

### **orders table**
- `id` - Order UUID
- `package_id` - Reference to package
- `user_email` - Customer email
- `user_name` - Customer name
- `esim_code` - Generated eSIM code
- `qr_code_data` - QR code data
- `status` - Order status (paid, activated, etc.)
- `amount` - Order amount
- `data_amount` - Data in GB
- `validity_days` - Package validity
- `country_name` - Country name
- `created_at` - Order creation timestamp

### **my_packages table**
- `id` - Package UUID
- `name` - Package name
- `sale_price` - Sale price
- `data_amount` - Data in GB
- `validity_days` - Validity period
- `country_name` - Country name
- `visible` - Whether package is visible

## 🚀 **Production Deployment**

### **Environment Variables Required**
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Security Considerations**
- Use app passwords for Gmail (not regular passwords)
- Enable 2FA on your email account
- Use environment variables for all sensitive data
- Consider using a dedicated email service (SendGrid, Mailgun, etc.)

## 📈 **Monitoring and Logs**

The system logs:
- Order creation events
- Email sending success/failure
- eSIM code generation
- QR code creation

Check logs in:
- Console output during development
- Log files in production
- Database audit trail

## 🎉 **Success!**

Your eSIM marketplace now has a complete order flow with:
- ✅ Automatic order creation
- ✅ eSIM code generation
- ✅ QR code creation
- ✅ Professional email notifications
- ✅ Step-by-step activation instructions
- ✅ Mobile-friendly design

Users will receive beautiful, professional emails with everything they need to activate their eSIM immediately! 