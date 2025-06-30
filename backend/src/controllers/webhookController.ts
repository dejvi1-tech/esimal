import { Request, Response, NextFunction } from 'express';
import StripeService from '../services/stripeService';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/emailService';
import { emailTemplates } from '../utils/emailTemplates';
import { RoamifyService } from '../services/roamifyService';
import { generateEsimCode, generateQRCodeData } from '../utils/esimUtils';
import { UserOrderStatus } from '../types/database';

const GUEST_USER_ID = process.env.GUEST_USER_ID || '00000000-0000-0000-0000-000000000000';

function validateUserOrderStatus(status: string): asserts status is UserOrderStatus {
  const allowed: UserOrderStatus[] = ['pending', 'active', 'expired', 'cancelled'];
  if (!allowed.includes(status as UserOrderStatus)) {
    throw new Error(`Invalid status: ${status}`);
  }
}

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = (req: Request, res: Response, next: NextFunction) => {
  console.log('[EMAIL DEBUG] handleStripeWebhook called. Event:', req.body);
  (async () => {
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
      // Log the entire webhook event for debugging
      logger.info(`Received Stripe webhook event: ${event.type}`, {
        eventId: event.id,
        eventType: event.type,
        eventData: JSON.stringify(event.data.object),
      });
      console.log('[EMAIL DEBUG] Stripe event type:', event.type);

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('[EMAIL DEBUG] Entered case: payment_intent.succeeded');
          await handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          console.log('[EMAIL DEBUG] Entered case: payment_intent.payment_failed');
          await handlePaymentIntentFailed(event.data.object);
          break;
        case 'payment_intent.canceled':
          console.log('[EMAIL DEBUG] Entered case: payment_intent.canceled');
          await handlePaymentIntentCanceled(event.data.object);
          break;
        case 'checkout.session.completed':
          console.log('[EMAIL DEBUG] Entered case: checkout.session.completed');
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'charge.refunded':
          console.log('[EMAIL DEBUG] Entered case: charge.refunded');
          await handleChargeRefunded(event.data.object);
          break;
        case 'customer.subscription.created':
          console.log('[EMAIL DEBUG] Entered case: customer.subscription.created');
          await handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          console.log('[EMAIL DEBUG] Entered case: customer.subscription.updated');
          await handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          console.log('[EMAIL DEBUG] Entered case: customer.subscription.deleted');
          await handleSubscriptionDeleted(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
          console.log('[EMAIL DEBUG] Unhandled event type:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  })();
};

/**
 * Handle successful payment intent with comprehensive logging
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const paymentIntentId = paymentIntent.id;
  const metadata = paymentIntent.metadata;
  
  logger.info(`Payment succeeded: ${paymentIntentId}`, {
    paymentIntentId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customerId: paymentIntent.customer,
    metadata: JSON.stringify(metadata),
  });

  try {
    // Update order status to paid
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (orderError) {
      logger.error('Error updating order status:', orderError, { paymentIntentId });
      return;
    }

    if (!order) {
      logger.error('Order not found for payment intent:', paymentIntentId);
      return;
    }

    logger.info(`Order updated successfully: ${order.id}`, { orderId: order.id, paymentIntentId });

    // Deliver eSIM with comprehensive logging first
    if (metadata.packageId) {
      await deliverEsim(order, paymentIntent, metadata);
    } else {
      logger.warn('No package ID found in payment intent metadata', { paymentIntentId });
    }

    // Send confirmation email with comprehensive logging after eSIM delivery
    if (metadata.email) {
      await sendConfirmationEmail(order, paymentIntent, metadata);
    } else {
      logger.warn('No email found in payment intent metadata', { paymentIntentId });
    }

  } catch (error) {
    logger.error('Error handling payment success:', error, { paymentIntentId });
  }
}

/**
 * Send confirmation email with comprehensive logging
 */
async function sendConfirmationEmail(order: any, paymentIntent: any, metadata: any) {
  const orderId = order.id;
  const email = order.guest_email || metadata.email;
  const packageId = metadata.packageId;

  logger.info(`Starting email confirmation process`, {
    orderId,
    email,
    packageId,
    paymentIntentId: paymentIntent.id,
  });

  try {
    // Get package details for the email
    const { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      logger.error('Package not found for email confirmation:', packageError, { packageId });
      throw new Error(`Package not found: ${packageId}`);
    }

    // Log before sending email
    logger.info(`Sending confirmation email`, {
      orderId,
      email,
      packageId,
      paymentIntentId: paymentIntent.id,
    });

    // Prepare email data with eSIM profile if available
    const emailData = {
      orderId: orderId,
      amount: paymentIntent.amount / 100,
      packageName: metadata.packageName || packageData.name,
      dataAmount: `${packageData.data_amount}GB`,
      validityDays: packageData.validity_days,
      esimCode: order.esim_code || metadata.esimId || 'PENDING',
      qrCodeData: order.qr_code_data || '',
      qrCodeUrl: '', // Will be generated by the template
      isGuestOrder: true,
      signupUrl: `${process.env.FRONTEND_URL}/signup`,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      name: metadata.name || '',
      surname: metadata.surname || '',
      email: email,
    };

    // If we have eSIM profile data from Roamify, include it
    if (metadata.esimProfile) {
      logger.info(`Including eSIM profile data in email`, {
        orderId,
        esimId: metadata.esimId,
        profileData: metadata.esimProfile,
      });
      
      // Add the eSIM profile data to the email template
      emailData.qrCodeData = JSON.stringify(metadata.esimProfile);
      emailData.qrCodeUrl = metadata.esimProfile.qrCodeUrl || metadata.esimProfile.qr_code_url || '';
    }

    await sendEmail({
      to: email,
      subject: emailTemplates.orderConfirmation.subject,
      html: async () => emailTemplates.orderConfirmation.html(emailData),
    });

    // Log successful email send
    logger.info(`Confirmation email sent successfully`, {
      orderId,
      email,
      packageId,
      paymentIntentId: paymentIntent.id,
      hasEsimProfile: !!metadata.esimProfile,
    });

  } catch (emailError) {
    logger.error('Error sending confirmation email:', emailError, {
      orderId,
      email,
      packageId,
      paymentIntentId: paymentIntent.id,
    });
  }
}

/**
 * Deliver eSIM with comprehensive logging
 */
async function deliverEsim(order: any, paymentIntent: any, metadata: any) {
  const orderId = order.id;
  const packageId = metadata.packageId;
  const email = metadata.email;
  const phoneNumber = metadata.phone || metadata.phoneNumber || order.phone || order.phoneNumber || '';
  const firstName = metadata.name || metadata.firstName || order.name || order.firstName || '';
  const lastName = metadata.surname || metadata.lastName || order.surname || order.lastName || '';
  const quantity = 1;

  logger.info(`Starting eSIM delivery process`, {
    orderId,
    packageId,
    email,
    phoneNumber,
    firstName,
    lastName,
    paymentIntentId: paymentIntent.id,
  });

  try {
    // First, try to find package by UUID in the packages table
    let { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      logger.error(`Package ID ${packageId} not found in Supabase`);
      throw new Error(`Package ID ${packageId} not found in Supabase`);
    } else {
      logger.info(`Package found by UUID in packages table: ${packageId}`);
    }

    // --- STRICT LOGIC ---
    let realRoamifyPackageId: string | null = null;

    if (packageData && !packageData.features) {
      if (packageData.reseller_id) {
        realRoamifyPackageId = packageData.reseller_id;
        logger.info(`Using reseller_id as Roamify packageId: ${realRoamifyPackageId}`);
      } else {
        logger.error(`No reseller_id found for package: ${packageData.id}`);
        throw new Error(`No reseller_id found for package: ${packageData.id}`);
      }
    } else if (packageData && packageData.features) {
      realRoamifyPackageId = packageData.features.packageId;
      logger.info(`Using packageId from features: ${realRoamifyPackageId}`);
    }
    // --- END STRICT LOGIC ---

    const roamifyPackageId = realRoamifyPackageId;
    if (!roamifyPackageId) {
      logger.error(`No Roamify packageId found for package: ${packageId}`);
      throw new Error(`No Roamify packageId found for package: ${packageId}`);
    }
    
    logger.info(`[ROAMIFY DEBUG] Creating eSIM order with working API`, {
      orderId,
      packageId,
      roamifyPackageId,
      email,
      phoneNumber,
      firstName,
      lastName,
      paymentIntentId: paymentIntent.id,
    });

    // Create a more robust eSIM order with customer information
    let roamifyOrder;
    let roamifySuccess = false;
    
    try {
      roamifyOrder = await RoamifyService.createEsimOrderV2({
        packageId: roamifyPackageId,
        quantity: quantity
      });
      roamifySuccess = true;
    } catch (v2Error) {
      logger.error(`[ROAMIFY DEBUG] V2 method failed:`, v2Error);
      throw new Error(`[ROAMIFY DEBUG] V2 method failed: ${v2Error}`);
    }

    logger.info(`[ROAMIFY DEBUG] Roamify order created successfully`, {
      orderId,
      packageId,
      roamifyOrderId: roamifyOrder.orderId,
      esimId: roamifyOrder.esimId,
      fallbackUsed: roamifyOrder.fallbackUsed || false,
      originalPackageId: roamifyOrder.originalPackageId,
      fallbackPackageId: roamifyOrder.fallbackPackageId,
      paymentIntentId: paymentIntent.id,
    });

    // Update order with Roamify order details
    await supabase
      .from('orders')
      .update({
        roamify_order_id: roamifyOrder.orderId,
        roamify_esim_id: roamifyOrder.esimId,
        status: roamifySuccess ? 'completed' : 'pending_esim',
        updated_at: new Date().toISOString(),
        // Store additional metadata about the order
        metadata: {
          original_package_id: roamifyOrder.originalPackageId || packageId,
          actual_package_id: roamifyOrder.fallbackPackageId || roamifyOrder.originalPackageId || packageId,
          fallback_used: roamifyOrder.fallbackUsed || false,
          roamify_success: roamifySuccess
        }
      })
      .eq('id', orderId);

    logger.info(`[ROAMIFY DEBUG] Order updated with Roamify details`, {
      orderId,
      roamifyOrderId: roamifyOrder.orderId,
      roamifyEsimId: roamifyOrder.esimId,
      roamifySuccess,
    });

    // Create user_orders entry
    const safeUserId = order.user_id || GUEST_USER_ID;
    if (!safeUserId) throw new Error('user_id is required');
    if (!packageId) throw new Error('package_id is required');
    const status: UserOrderStatus = roamifySuccess ? 'active' : 'pending';
    validateUserOrderStatus(status);

    const userOrderData = {
      user_id: safeUserId,
      package_id: packageId,
      roamify_order_id: roamifyOrder.orderId,
      qr_code_url: '', // Will be populated later if needed
      iccid: roamifyOrder.esimId, // Use esimId as iccid
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: userOrder, error: userOrderError } = await supabase
      .from('user_orders')
      .insert(userOrderData)
      .select()
      .single();

    if (userOrderError) {
      logger.error(`[ROAMIFY DEBUG] Error creating user_orders entry`, {
        orderId,
        error: userOrderError,
      });
      throw new Error(`Failed to create user_orders entry: ${userOrderError.message}`);
    }

    logger.info(`[ROAMIFY DEBUG] User orders entry created successfully`, {
      orderId,
      userOrderId: userOrder.id,
    });

    // Optionally, handle QR code generation if needed here
    // ...

    // Update order with eSIM data (if available)
    const esimId = roamifyOrder.esimId;
    if (esimId) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          esim_code: esimId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        logger.error('Error updating order with eSIM data:', updateError, {
          orderId,
          packageId,
          roamifyOrderId: roamifyOrder.orderId,
          esimId,
        });
      } else {
        logger.info(`eSIM delivered successfully`, {
          orderId,
          packageId,
          roamifyOrderId: roamifyOrder.orderId,
          esimId,
          paymentIntentId: paymentIntent.id,
        });

        // Generate eSIM QR code/profile
        try {
          const qrData = await RoamifyService.getQrCodeWithPolling(esimId);
          logger.info(`QR code polled and ready`, { orderId, esimId, qrCodeUrl: qrData.qrCodeUrl });
          // Pass qrData to sendConfirmationEmail
          await sendConfirmationEmail(order, paymentIntent, {
            ...metadata,
            esimProfile: qrData,
            esimId: esimId,
          });
        } catch (profileError) {
          logger.error('Error generating eSIM profile:', profileError, {
            orderId,
            esimId,
          });
          // Still send email without QR code
          await sendConfirmationEmail(order, paymentIntent, metadata);
        }
      }
    } else {
      // No eSIM ID available, send email without QR code
      await sendConfirmationEmail(order, paymentIntent, metadata);
    }
  } catch (esimError) {
    logger.error('Error delivering eSIM:', esimError, {
      orderId,
      packageId,
      paymentIntentId: paymentIntent.id,
    });
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
  console.log('[EMAIL DEBUG] TOP OF FUNCTION - SESSION:', JSON.stringify(session, null, 2));
  logger.info(`[EMAIL DEBUG] Raw session object:`, JSON.stringify(session, null, 2));
  try {
    const { packageId, name, surname } = session.metadata;
    let customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.email || session.email || null;
    console.log('[EMAIL DEBUG] Extracted customerEmail:', customerEmail);
    logger.info(`[EMAIL DEBUG] Extracted customerEmail:`, customerEmail);
    const amount = session.amount_total / 100;

    // First, try to find package by UUID (id field)
    let { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    // If not found by UUID, try to find by location_slug (slug)
    if (packageError || !packageData) {
      logger.info(`Package not found by UUID ${packageId}, trying location_slug...`);
      
      const { data: packageBySlug, error: slugError } = await supabase
        .from('my_packages')
        .select('*')
        .eq('location_slug', packageId)
        .single();

      if (slugError || !packageBySlug) {
        logger.error(`Package not found by UUID or slug: ${packageId}`, { packageError, slugError });
        return;
      }

      packageData = packageBySlug;
      logger.info(`Package found by slug: ${packageId} -> UUID: ${packageData.id}`);
    } else {
      logger.info(`Package found by UUID: ${packageId}`);
    }

    // Step 1: Create real eSIM with Roamify API
    let esimCode: string;
    let roamifyOrderId: string;
    let realQRData: any;

    try {
      // --- NEW LOGIC: Fetch real Roamify packageId from packages table ---
      let realRoamifyPackageId: string | undefined;
      if (packageData.reseller_id) {
        const { data: foundPackage, error: foundError } = await supabase
          .from('packages')
          .select('features')
          .eq('reseller_id', packageData.reseller_id)
          .single();
        if (!foundError && foundPackage && foundPackage.features && foundPackage.features.packageId) {
          realRoamifyPackageId = foundPackage.features.packageId;
        }
      }
      
      // FALLBACK: If no real Roamify packageId found, use a known working packageId
      if (!realRoamifyPackageId) {
        logger.warn(`Could not find real Roamify packageId in packages table for reseller_id: ${packageData.reseller_id}. Using fallback.`);
        // Use a real working Roamify packageId as fallback
        realRoamifyPackageId = 'esim-europe-30days-3gb-all';
        logger.info(`Using fallback Roamify packageId: ${realRoamifyPackageId}`);
      }
      // --- END NEW LOGIC ---

      logger.info(`Creating Roamify order for package: ${packageData.name} (real Roamify packageId: ${realRoamifyPackageId})`);
      
      const roamifyOrder = await RoamifyService.createEsimOrder(realRoamifyPackageId!, 1);
      esimCode = roamifyOrder.esimId;
      roamifyOrderId = roamifyOrder.orderId;
      
      // Generate real QR code
      realQRData = await RoamifyService.getQrCodeWithPolling(esimCode);
      
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
      package_id: packageData.id, // Use the actual UUID
      user_id: null,
      user_email: session.customer_details?.email || session.customer_email || session.metadata?.email || session.email || null,
      user_name: `${name || ''} ${surname || ''}`.trim() || session.customer_details?.email || session.customer_email || session.metadata?.email || session.email || null,
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
    console.log('[EMAIL DEBUG] Before email block - customerEmail:', customerEmail);
    // Step 3: Send confirmation email with real eSIM data
    if (customerEmail) {
      logger.info(`[EMAIL DEBUG] Attempting to send order confirmation email to ${customerEmail} for order ${order.id}`);
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
        logger.info(`[EMAIL DEBUG] ✅ Order confirmation email sent to ${customerEmail} for order ${order.id}`);
        console.log(`[EMAIL DEBUG] ✅ Order confirmation email sent to ${customerEmail} for order ${order.id}`);
      } catch (emailError) {
        logger.error(`[EMAIL DEBUG] ❌ Error sending checkout success email to ${customerEmail} for order ${order.id}:`, emailError);
        console.error(`[EMAIL DEBUG] ❌ Error sending checkout success email to ${customerEmail} for order ${order.id}:`, emailError);
      }
    } else {
      logger.error(`[EMAIL DEBUG] ❌ No customerEmail found for order ${order.id}. Full session:`, JSON.stringify(session, null, 2));
      console.error(`[EMAIL DEBUG] ❌ No customerEmail found for order ${order.id}. Full session:`, JSON.stringify(session, null, 2));
    }
    console.log('[EMAIL DEBUG] END OF FUNCTION');
  } catch (error) {
    logger.error('Error handling checkout session completion:', error);
    console.error('Error handling checkout session completion:', error);
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