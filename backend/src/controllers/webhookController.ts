import { Request, Response, NextFunction } from 'express';
import StripeService from '../services/stripeService';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/emailService';
import { emailTemplates } from '../utils/emailTemplates';
import { RoamifyService } from '../services/roamifyService';
import { generateEsimCode, generateQRCodeData } from '../utils/esimUtils';

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: any;

  try {
    event = StripeService.constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  logger.info(`Payment succeeded: ${paymentIntent.id}`);

  try {
    // Update order status to paid
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select()
      .single();

    if (orderError) {
      logger.error('Error updating order status:', orderError);
      return;
    }

    // Send confirmation email
    if (order && paymentIntent.metadata.userEmail) {
      try {
        await sendEmail({
          to: paymentIntent.metadata.userEmail,
          subject: emailTemplates.paymentSuccess.subject,
          html: async () => emailTemplates.paymentSuccess.html({
            orderId: order.id,
            amount: paymentIntent.amount / 100,
            packageName: paymentIntent.metadata.packageName || 'eSIM Package',
            paymentIntentId: paymentIntent.id,
          }),
        });
        logger.info(`Payment success email sent to ${paymentIntent.metadata.userEmail}`);
      } catch (emailError) {
        logger.error('Error sending payment success email:', emailError);
      }
    }
  } catch (error) {
    logger.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  logger.info(`Payment failed: ${paymentIntent.id}`);

  try {
    // Update order status to failed
    await supabase
      .from('orders')
      .update({ 
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed'
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Send failure notification email
    if (paymentIntent.metadata.userEmail) {
      try {
        await sendEmail({
          to: paymentIntent.metadata.userEmail,
          subject: emailTemplates.paymentFailed.subject,
          html: async () => emailTemplates.paymentFailed.html({
            amount: paymentIntent.amount / 100,
            packageName: paymentIntent.metadata.packageName || 'eSIM Package',
            failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
            retryUrl: `${process.env.FRONTEND_URL}/checkout?retry=true`,
          }),
        });
        logger.info(`Payment failure email sent to ${paymentIntent.metadata.userEmail}`);
      } catch (emailError) {
        logger.error('Error sending payment failure email:', emailError);
      }
    }
  } catch (error) {
    logger.error('Error handling payment failure:', error);
  }
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(paymentIntent: any) {
  logger.info(`Payment canceled: ${paymentIntent.id}`);

  try {
    // Update order status to canceled
    await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // Send cancellation notification email
    if (paymentIntent.metadata.userEmail) {
      try {
        await sendEmail({
          to: paymentIntent.metadata.userEmail,
          subject: emailTemplates.paymentCanceled.subject,
          html: async () => emailTemplates.paymentCanceled.html({
            amount: paymentIntent.amount / 100,
            packageName: paymentIntent.metadata.packageName || 'eSIM Package',
            retryUrl: `${process.env.FRONTEND_URL}/checkout?retry=true`,
          }),
        });
        logger.info(`Payment cancellation email sent to ${paymentIntent.metadata.userEmail}`);
      } catch (emailError) {
        logger.error('Error sending payment cancellation email:', emailError);
      }
    }
  } catch (error) {
    logger.error('Error handling payment cancellation:', error);
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session: any) {
  logger.info(`Checkout session completed: ${session.id}`);

  try {
    const { packageId, name, surname } = session.metadata;
    const customerEmail = session.customer_details?.email || session.customer_email;
    const amount = session.amount_total / 100;

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      logger.error('Package not found for checkout session:', packageId);
      return;
    }

    // Step 1: Create real eSIM with Roamify API
    let esimCode: string;
    let roamifyOrderId: string;
    let realQRData: any;

    try {
      logger.info(`Creating Roamify order for package: ${packageData.name} (${packageData.reseller_id})`);
      
      const roamifyOrder = await RoamifyService.createEsimOrder(packageData.reseller_id, 1);
      esimCode = roamifyOrder.esimId;
      roamifyOrderId = roamifyOrder.orderId;
      
      // Generate real QR code
      realQRData = await RoamifyService.generateRealQRCode(esimCode);
      
      logger.info(`Real eSIM created. Order ID: ${roamifyOrderId}, eSIM ID: ${esimCode}`);
    } catch (roamifyError) {
      logger.error('Failed to create Roamify order, using fallback:', roamifyError);
      
      // Fallback: Generate local eSIM code
      esimCode = await generateEsimCode();
      roamifyOrderId = `fallback-${Date.now()}`;
      realQRData = {
        lpaCode: generateQRCodeData(esimCode, packageData.name),
        qrCodeUrl: '',
        activationCode: esimCode,
        iosQuickInstall: '',
      };
    }

    // Step 2: Create order in database with real eSIM data
    const orderData = {
      packageId: packageId,
      user_id: null,
      user_email: customerEmail,
      user_name: `${name || ''} ${surname || ''}`.trim() || customerEmail,
      name,
      surname,
      esim_code: esimCode,
      qr_code_data: realQRData.lpaCode,
      roamify_order_id: roamifyOrderId,
      status: 'paid',
      amount: amount,
      data_amount: packageData.data_amount,
      validity_days: packageData.validity_days,
      country_name: packageData.country_name,
      stripe_payment_intent_id: session.payment_intent,
      stripe_customer_id: session.customer,
      stripe_checkout_session_id: session.id,
      created_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      logger.error('Error creating order after checkout:', orderError);
      return;
    }

    logger.info(`Order created successfully: ${order.id}`);

    // Step 3: Send confirmation email with real eSIM data
    if (customerEmail) {
      try {
        await sendEmail({
          to: customerEmail,
          subject: emailTemplates.orderConfirmation.subject,
          html: async () => emailTemplates.orderConfirmation.html({
            orderId: order.id,
            packageName: packageData.name,
            amount: amount,
            dataAmount: `${packageData.data_amount}GB`,
            validityDays: packageData.validity_days,
            esimCode: esimCode,
            qrCodeData: realQRData.lpaCode,
            qrCodeUrl: realQRData.qrCodeUrl,
            isGuestOrder: true,
            signupUrl: `${process.env.FRONTEND_URL}/signup`,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
            name,
            surname,
            email: customerEmail,
          }),
        });
        logger.info(`Order confirmation email sent to ${customerEmail} for order ${order.id}`);
      } catch (emailError) {
        logger.error('Error sending checkout success email:', emailError);
      }
    }
  } catch (error) {
    logger.error('Error handling checkout session completion:', error);
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: any) {
  logger.info(`Charge refunded: ${charge.id}`);

  try {
    // Update order status to refunded
    await supabase
      .from('orders')
      .update({ 
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        stripe_refund_id: charge.refunds?.data[0]?.id
      })
      .eq('stripe_payment_intent_id', charge.payment_intent);

    // Send refund notification email
    const { data: order } = await supabase
      .from('orders')
      .select('user_email, packageId')
      .eq('stripe_payment_intent_id', charge.payment_intent)
      .single();

    if (order?.user_email) {
      try {
        await sendEmail({
          to: order.user_email,
          subject: emailTemplates.refundProcessed.subject,
          html: async () => emailTemplates.refundProcessed.html({
            amount: charge.amount_refunded / 100,
            refundId: charge.refunds?.data[0]?.id,
            orderId: order.packageId,
          }),
        });
        logger.info(`Refund email sent to ${order.user_email}`);
      } catch (emailError) {
        logger.error('Error sending refund email:', emailError);
      }
    }
  } catch (error) {
    logger.error('Error handling charge refunded:', error);
  }
}

/**
 * Handle subscription created (for future use)
 */
async function handleSubscriptionCreated(subscription: any) {
  logger.info(`Subscription created: ${subscription.id}`);
  // Implement subscription handling logic here
}

/**
 * Handle subscription updated (for future use)
 */
async function handleSubscriptionUpdated(subscription: any) {
  logger.info(`Subscription updated: ${subscription.id}`);
  // Implement subscription update logic here
}

/**
 * Handle subscription deleted (for future use)
 */
async function handleSubscriptionDeleted(subscription: any) {
  logger.info(`Subscription deleted: ${subscription.id}`);
  // Implement subscription deletion logic here
} 