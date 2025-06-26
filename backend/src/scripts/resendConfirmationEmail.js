const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('../src/services/emailService');
const { emailTemplates } = require('../src/utils/emailTemplates');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resendEmail(paymentIntentId) {
  // 1. Find the order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (error || !order) {
    console.error('Order not found for payment intent:', paymentIntentId);
    process.exit(1);
  }

  // 2. Find the package
  const { data: pkg } = await supabase
    .from('my_packages')
    .select('*')
    .eq('id', order.packageId)
    .single();

  // 3. Send the email
  await sendEmail({
    to: order.user_email,
    subject: emailTemplates.paymentSuccess.subject,
    html: () => emailTemplates.paymentSuccess.html({
      orderId: order.id,
      amount: order.amount,
      packageName: pkg ? pkg.name : 'eSIM Package',
      paymentIntentId: paymentIntentId,
    }),
  });

  console.log('Confirmation email sent to', order.user_email);
}

resendEmail('pi_3Re1RMDEHnCVTkPq1iSKph1c');