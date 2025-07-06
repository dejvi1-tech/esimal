import { Request, Response, NextFunction } from 'express';
import StripeService from '../services/stripeService';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/emailService';
import { emailTemplates } from '../utils/emailTemplates';
import { RoamifyService } from '../services/roamifyService';
import { generateEsimCode, generateQRCodeData } from '../utils/esimUtils';
import { UserOrderStatus } from '../types/database';
import { createClient } from '@supabase/supabase-js';

const GUEST_USER_ID = process.env.GUEST_USER_ID || '00000000-0000-0000-0000-000000000000';

// Create supabaseAdmin client for RLS-protected operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function validateUserOrderStatus(status: string): asserts status is UserOrderStatus {
  const allowed: UserOrderStatus[] = ['pending', 'active', 'expired', 'cancelled'];
  if (!allowed.includes(status as UserOrderStatus)) {
    throw new Error(`Invalid status: ${status}`);
  }
}

/**
 * Validate that a package ID exists in either my_packages or packages table
 * This helps catch package lookup issues early
 */
async function validatePackageExists(packageId: string, context: string = 'unknown'): Promise<{ found: boolean, table: string | null, packageData: any | null }> {
  try {
    // First check my_packages table
    const { data: myPackageData, error: myPackageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (!myPackageError && myPackageData) {
      logger.info(`Package validation: Found ${packageId} in my_packages table (context: ${context})`);
      return { found: true, table: 'my_packages', packageData: myPackageData };
    }

    // Then check packages table
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (!packageError && packageData) {
      logger.info(`Package validation: Found ${packageId} in packages table (context: ${context})`);
      return { found: true, table: 'packages', packageData: packageData };
    }

    logger.warn(`Package validation: ${packageId} not found in either table (context: ${context})`, {
      myPackageError: myPackageError?.message,
      packageError: packageError?.message,
    });
    
    return { found: false, table: null, packageData: null };
  } catch (error) {
    logger.error(`Package validation error for ${packageId} (context: ${context}):`, error);
    return { found: false, table: null, packageData: null };
  }
}

/**
 * Handle Stripe webhook events with idempotency protection
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
      // IDEMPOTENCY CHECK: Prevent duplicate event processing
      const eventId = event.id;
      const eventType = event.type;
      
      // Check if we've already processed this event
      const { data: existingEvent, error: checkError } = await supabaseAdmin
        .from('processed_events')
        .select('id, processed_at, status')
        .eq('event_id', eventId)
        .single();

      if (existingEvent) {
        logger.info(`⚡ Event ${eventId} already processed at ${existingEvent.processed_at} with status ${existingEvent.status}`, {
          eventId,
          eventType,
          previousProcessingStatus: existingEvent.status,
          duplicateAttempt: true,
        });
        return res.json({ 
          received: true, 
          message: 'Event already processed',
          previousStatus: existingEvent.status 
        });
      }

      // Create processing record to mark this event as being handled
      const { error: insertError } = await supabaseAdmin
        .from('processed_events')
        .insert({
          event_id: eventId,
          event_type: eventType,
          status: 'processing',
          payload: event,
          processed_at: new Date().toISOString(),
        });

      if (insertError) {
        logger.error('Failed to create processing record - potential duplicate event', {
          eventId,
          eventType,
          error: insertError.message,
        });
        // If insert fails due to unique constraint, it means another process is handling this event
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          logger.warn(`⚡ Event ${eventId} is being processed by another instance - skipping`);
          return res.json({ received: true, message: 'Event being processed by another instance' });
        }
        // For other errors, continue processing but log the issue
        logger.warn('Processing record creation failed but continuing with event processing');
      }

      // Log the entire webhook event for debugging
      logger.info(`Received Stripe webhook event: ${event.type}`, {
        eventId: event.id,
        eventType: event.type,
        eventData: JSON.stringify(event.data.object),
      });
      console.log('[EMAIL DEBUG] Stripe event type:', event.type);

      let processingStatus = 'completed';
      let processingError = null;

      try {
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
      } catch (eventError: any) {
        processingStatus = 'failed';
        processingError = eventError.message;
        throw eventError;
      } finally {
        // Update processing status
        if (!insertError) {
          await supabaseAdmin
            .from('processed_events')
            .update({
              status: processingStatus,
              error_message: processingError,
              completed_at: new Date().toISOString(),
            })
            .eq('event_id', eventId);
        }
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
    // EARLY VALIDATION: Check if package exists before proceeding
    if (metadata.packageId) {
      const packageValidation = await validatePackageExists(metadata.packageId, 'payment_intent_succeeded');
      if (!packageValidation.found) {
        logger.error(`CRITICAL: Package ID ${metadata.packageId} from payment intent metadata does not exist in database`, {
          paymentIntentId,
          packageId: metadata.packageId,
          metadata: JSON.stringify(metadata),
        });
        
        // Still try to update the order, but mark it as problematic
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({ 
            status: 'paid_but_package_missing',
            updated_at: new Date().toISOString(),
            metadata: {
              error: 'Package ID not found in database',
              original_package_id: metadata.packageId,
              needs_admin_review: true
            }
          })
          .eq('payment_intent_id', paymentIntentId)
          .select()
          .single();

        if (!orderError && order) {
          logger.error(`Order ${order.id} marked as 'paid_but_package_missing' - requires admin review`, {
            orderId: order.id,
            packageId: metadata.packageId,
            paymentIntentId,
          });
        }
        
        return; // Don't proceed with eSIM delivery
      } else {
        logger.info(`Package validation passed: ${metadata.packageId} found in ${packageValidation.table} table`);
      }
    }

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

        // Deliver eSIM with two-step email flow (thank you + QR code emails)
    if (metadata.packageId) {
      await deliverEsim(order, paymentIntent, metadata);
    } else {
      logger.warn('No package ID found in payment intent metadata', { paymentIntentId });
    }
    
    // Note: Email sending is now integrated into deliverEsim() function
    // No separate email call needed - deliverEsim() handles both:
    // 1. Immediate thank you email after payment
    // 2. QR code email after polling (if successful)

  } catch (error) {
    logger.error('Error handling payment success:', error, { paymentIntentId });
  }
}

function isValidEsimProfile(qrData: any): boolean {
  return !!(qrData && (qrData.qrCodeUrl || qrData.lpaCode || qrData.activationCode));
}

/**
 * Send immediate thank you email after payment confirmation
 */
async function sendThankYouEmail(order: any, paymentIntent: any, metadata: any) {
  const orderId = order.id;
  const email = order.guest_email || metadata.email;
  const packageId = metadata.packageId;

  logger.info(`📧 Sending immediate thank you email`, {
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
      logger.error('Package not found for thank you email:', packageError, { packageId });
      throw new Error(`Package not found: ${packageId}`);
    }

    // Prepare thank you email data
    const emailData = {
      orderId: orderId,
      amount: paymentIntent.amount / 100,
      packageName: metadata.packageName || packageData.name,
      dataAmount: `${packageData.data_amount}GB`,
      days: packageData.days,
      name: metadata.name || '',
      surname: metadata.surname || '',
      email: email,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    };

    await sendEmail({
      to: email,
      subject: emailTemplates.thankYou.subject,
      html: async () => emailTemplates.thankYou.html(emailData),
    });

    logger.info(`✅ Thank you email sent successfully`, {
      orderId,
      email,
      packageId,
      paymentIntentId: paymentIntent.id,
    });

  } catch (emailError) {
    logger.error('❌ Error sending thank you email:', emailError, {
      orderId,
      email,
      packageId,
      paymentIntentId: paymentIntent.id,
    });
    // Don't throw error - this shouldn't stop the eSIM delivery process
  }
}

/**
 * Send confirmation email with comprehensive logging
 */
async function sendConfirmationEmail(order: any, paymentIntent: any, metadata: any) {
  const orderId = order.id;
  const email = order.guest_email || metadata.email;
  const packageId = metadata.packageId;

  // Guard: Do not send if eSIM profile is missing/invalid
  if (metadata.esimProfile && !isValidEsimProfile(metadata.esimProfile)) {
    logger.warn(`❌ Not sending confirmation email: eSIM profile is missing/invalid`, {
      orderId,
      email,
      packageId,
      esimProfile: metadata.esimProfile,
    });
    return;
  }

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
      days: packageData.days,
      esimCode: metadata.esimId || order.esim_code || order.roamify_esim_id || 'PENDING',
      iccid: order.iccid || metadata.esimId || order.esim_code || order.roamify_esim_id || '', // Use real ICCID if available
      qrCodeData: '', // Will be set from real Roamify data first, then fallback to DB
      qrCodeUrl: '',
      isGuestOrder: true,
      signupUrl: `${process.env.FRONTEND_URL}/signup`,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      name: metadata.name || '',
      surname: metadata.surname || '',
      email: email,
    };

    // PRIORITY 1: Use real eSIM profile data from Roamify (this should be the primary source)
    if (metadata.esimProfile) {
      logger.info(`✅ Using REAL QR code data from Roamify for email`, {
        orderId,
        esimId: metadata.esimId,
        hasQrCodeUrl: !!metadata.esimProfile.qrCodeUrl,
        hasLpaCode: !!metadata.esimProfile.lpaCode,
        hasActivationCode: !!metadata.esimProfile.activationCode,
        qrCodeUrl: metadata.esimProfile.qrCodeUrl,
        lpaCodePreview: metadata.esimProfile.lpaCode ? `${metadata.esimProfile.lpaCode.substring(0, 50)}...` : null,
        activationCodePreview: metadata.esimProfile.activationCode ? `${metadata.esimProfile.activationCode.substring(0, 20)}...` : null,
      });
      
      // Use the real eSIM profile data from Roamify - ABSOLUTE PRIORITY
      emailData.esimCode = metadata.esimId || emailData.esimCode;
      emailData.iccid = metadata.iccid || emailData.iccid; // Use real ICCID if available
      emailData.qrCodeUrl = metadata.esimProfile.qrCodeUrl || '';
      
      // CRITICAL: Use real LPA code from Roamify - this is the most important field
      if (metadata.esimProfile.lpaCode) {
        emailData.qrCodeData = metadata.esimProfile.lpaCode;
        logger.info(`✅ Using REAL LPA code from Roamify: ${metadata.esimProfile.lpaCode.substring(0, 50)}...`);
      } else if (metadata.esimProfile.activationCode) {
        emailData.qrCodeData = metadata.esimProfile.activationCode;
        logger.info(`✅ Using REAL activation code from Roamify: ${metadata.esimProfile.activationCode.substring(0, 20)}...`);
      } else {
        logger.warn(`⚠️ No LPA code or activation code in Roamify profile, using fallback`);
        emailData.qrCodeData = order.qr_code_data || '';
      }
      
      // Add iOS quick install URL if available
      if (metadata.esimProfile.iosQuickInstall) {
        (emailData as any).iosQuickInstall = metadata.esimProfile.iosQuickInstall;
      }
      
      // Log confirmation of real data usage
      logger.info(`✅ Email will use REAL Roamify QR code data`, {
        orderId,
        realDataUsed: true,
        qrCodeDataLength: emailData.qrCodeData ? emailData.qrCodeData.length : 0,
        qrCodeDataType: metadata.esimProfile.lpaCode ? 'LPA_CODE' : 'ACTIVATION_CODE',
        hasQrCodeUrl: !!emailData.qrCodeUrl,
        esimCode: emailData.esimCode,
      });
      
    } else {
      // FALLBACK: Use database data if no real Roamify profile available
      logger.warn(`⚠️ No real Roamify eSIM profile available, using database fallback`, {
        orderId,
        esimId: metadata.esimId,
        availableMetadataKeys: Object.keys(metadata),
        orderQrCodeData: order.qr_code_data ? `${order.qr_code_data.substring(0, 50)}...` : 'none',
      });
      
      emailData.qrCodeData = order.qr_code_data || '';
      
      if (!emailData.qrCodeData) {
        logger.error(`❌ NO QR CODE DATA AVAILABLE - neither from Roamify nor database`, {
          orderId,
          esimId: metadata.esimId,
          hasMetadataProfile: !!metadata.esimProfile,
          orderQrCodeData: order.qr_code_data,
          orderEsimCode: order.esim_code,
        });
      }
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
  
  // Extract package days from metadata or package data
  const packageDays = metadata.packageDays || metadata.validityDays || metadata.days;
  const days = packageDays ? parseInt(packageDays, 10) : undefined;

  logger.info(`🚀 Starting eSIM delivery process`, {
    orderId,
    packageId,
    email,
    phoneNumber,
    firstName,
    lastName,
    paymentIntentId: paymentIntent.id,
  });

  try {
    // FIXED: First, try to find package by UUID in the my_packages table (matches handleCheckoutSessionCompleted)
    let { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    // FALLBACK: If not found in my_packages, try packages table as secondary lookup
    if (packageError || !packageData) {
      logger.info(`Package ID ${packageId} not found in my_packages table, trying packages table as fallback...`);
      
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();
      
      if (packagesError || !packagesData) {
        logger.error(`❌ Package ID ${packageId} not found in either my_packages or packages table`, {
          myPackagesError: packageError,
          packagesError: packagesError,
          packageId,
          orderId,
          paymentIntentId: paymentIntent.id,
        });
        
        // ENHANCED ERROR: Provide more context about what went wrong
        throw new Error(`Package ID ${packageId} not found in Supabase. Checked both my_packages and packages tables. This suggests a data consistency issue where the package used for checkout no longer exists in the database.`);
      }
      
      packageData = packagesData;
      logger.info(`✅ Package found in packages table as fallback: ${packageId}`);
    } else {
      logger.info(`✅ Package found in my_packages table: ${packageId}`);
    }

    // --- EXACT ROAMIFY SLUG LOGIC ---
    if (!packageData.slug) {
      logger.error(`❌ No slug found for package: ${packageId}. Package data:`, {
        packageId: packageData.id,
        name: packageData.name,
        hasSlug: !!packageData.slug,
        orderId,
      });
      throw new Error(`No Roamify slug found for package: ${packageId}. Package may not be properly configured for eSIM delivery.`);
    }

    const roamifyPackageId = packageData.slug;
    logger.info(`📦 Using exact Roamify slug: ${roamifyPackageId}`);
    // --- END EXACT ROAMIFY SLUG LOGIC ---
    
    logger.info(`🔧 Creating eSIM order with Roamify API`, {
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
    let roamifyError = null;
    
    try {
      roamifyOrder = await RoamifyService.createEsimOrderV2({
        packageId: roamifyPackageId,
        quantity: quantity
      });
      roamifySuccess = true;
      
      logger.info(`✅ Roamify order created successfully`, {
        orderId,
        packageId,
        roamifyOrderId: roamifyOrder.orderId,
        esimId: roamifyOrder.esimId,
        paymentIntentId: paymentIntent.id,
      });
    } catch (v2Error: unknown) {
      roamifyError = v2Error;
      logger.error(`❌ Roamify order creation failed:`, v2Error);
      
      // Log detailed error information for debugging
      if (v2Error && typeof v2Error === 'object' && 'response' in v2Error) {
        const axiosError = v2Error as any;
        logger.error(`Roamify API Error Details:`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
          packageId: roamifyPackageId,
          orderId,
          paymentIntentId: paymentIntent.id,
        });
      }
      
      // Don't throw immediately - update order with error status and continue
      logger.warn(`⚠️ Continuing with order processing despite Roamify failure`);
    }

    // Update order with Roamify order details
    const orderUpdateData: any = {
      status: roamifySuccess ? 'completed' : 'pending_esim',
      updated_at: new Date().toISOString(),
      metadata: {
        roamify_package_id: roamifyPackageId,
        roamify_success: roamifySuccess,
        roamify_error: roamifyError ? {
          message: roamifyError instanceof Error ? roamifyError.message : String(roamifyError),
          status: roamifyError && typeof roamifyError === 'object' && 'response' in roamifyError ? (roamifyError as any).response?.status : undefined,
          data: roamifyError && typeof roamifyError === 'object' && 'response' in roamifyError ? (roamifyError as any).response?.data : undefined
        } : null
      }
    };

    if (roamifySuccess && roamifyOrder) {
      orderUpdateData.roamify_order_id = roamifyOrder.orderId;
      orderUpdateData.roamify_esim_id = roamifyOrder.esimId;
    }

    await supabase
      .from('orders')
      .update(orderUpdateData)
      .eq('id', orderId);

    logger.info(`💾 Order updated with Roamify details`, {
      orderId,
      roamifyOrderId: roamifySuccess && roamifyOrder ? roamifyOrder.orderId : null,
      roamifyEsimId: roamifySuccess && roamifyOrder ? roamifyOrder.esimId : null,
      roamifySuccess,
    });

    // Create user_orders entry
    const safeUserId = order.user_id || GUEST_USER_ID;
    if (!safeUserId) throw new Error('user_id is required');
    if (!packageId) throw new Error('package_id is required');
    const status: UserOrderStatus = roamifySuccess ? 'active' : 'pending';
    validateUserOrderStatus(status);

    // OPTIMIZED: Ensure guest user exists before creating user_orders entry
    if (safeUserId === GUEST_USER_ID) {
      logger.info(`👤 Creating user_orders entry for guest user: ${GUEST_USER_ID}`);
      
      // Check if guest user exists (should exist due to migration) - USE ADMIN CLIENT
      const { data: guestUser, error: guestUserError } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', GUEST_USER_ID)
        .single();
      
      if (guestUserError || !guestUser) {
        logger.warn(`⚠️ Guest user ${GUEST_USER_ID} not found - this should not happen after migration`);
        
        // The migration should have created this user, but as a fallback, try to create it
        // with the service role client
        try {
          const { data: newGuestUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              id: GUEST_USER_ID,
              email: 'guest@esimal.com',
              password: 'disabled-account',
              role: 'user'
            })
            .select()
            .single();
            
          if (createError) {
            logger.error(`❌ Failed to create guest user even with optimized approach: ${createError.message}`);
            
            // Update order metadata and continue without user_orders
            await supabase
              .from('orders')
              .update({
                metadata: {
                  ...order.metadata,
                  user_orders_skipped: true,
                  guest_user_creation_failed: true,
                  requires_admin_review: true
                }
              })
              .eq('id', orderId);
            
            logger.warn(`⚠️ Order ${orderId} will continue without user_orders entry - proceeding to email delivery`);
          } else {
            logger.info(`✅ Guest user created successfully as fallback: ${newGuestUser.id}`);
          }
        } catch (guestCreationError) {
          logger.error(`❌ Exception creating guest user:`, guestCreationError);
          
          // Mark for admin review and continue
          await supabase
            .from('orders')
            .update({
              metadata: {
                ...order.metadata,
                user_orders_skipped: true,
                guest_user_creation_exception: true,
                requires_admin_review: true
              }
            })
            .eq('id', orderId);
          
          logger.warn(`⚠️ Order ${orderId} proceeding to email delivery despite guest user creation exception`);
        }
      } else {
        logger.info(`✅ Guest user exists: ${GUEST_USER_ID} (${guestUser.email})`);
      }
    }

    const userOrderData = {
      user_id: safeUserId,
      package_id: packageId,
      roamify_order_id: roamifySuccess && roamifyOrder ? roamifyOrder.orderId : null,
      qr_code_url: '', // Will be populated later if needed
      iccid: null, // Will be updated with real ICCID after retrieval
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // USE ADMIN CLIENT to bypass RLS policies
    const { data: userOrder, error: userOrderError } = await supabaseAdmin
      .from('user_orders')
      .insert(userOrderData)
      .select()
      .single();

    if (userOrderError) {
      logger.error(`❌ Error creating user_orders entry`, {
        orderId,
        error: userOrderError,
        userOrderData,
        guestUserId: GUEST_USER_ID,
      });
      
      // ENHANCED: Don't throw error, just log and mark for admin review
      logger.warn(`⚠️ Continuing eSIM delivery despite user_orders creation failure for order ${orderId}`);
      
      // Update order metadata to indicate this needs admin attention
      await supabase
        .from('orders')
        .update({
          metadata: {
            ...order.metadata,
            user_orders_creation_failed: true,
            user_orders_error: userOrderError.message,
            requires_admin_review: true
          }
        })
        .eq('id', orderId);
      
      // Continue with email flow - don't return early
      logger.warn(`⚠️ Order ${orderId} proceeding to email delivery despite user_orders creation failure`);
    } else {
      logger.info(`✅ User orders entry created successfully`, {
        orderId,
        userOrderId: userOrder?.id,
      });
    }

    // CRITICAL: Update order with eSIM data and generate QR code
    if (!roamifySuccess || !roamifyOrder) {
      logger.error(`❌ Cannot proceed with eSIM delivery - Roamify order creation failed`, {
        orderId,
        roamifySuccess,
        roamifyError: roamifyError instanceof Error ? roamifyError.message : String(roamifyError),
        packageId,
        paymentIntentId: paymentIntent.id,
      });
      
      // Send thank you email but inform customer about delay
      logger.info(`📧 Sending thank you email with delay notification`);
      await sendThankYouEmail(order, paymentIntent, {
        ...metadata,
        roamifyError: true,
        delayNotification: true
      });
      
      // Mark order for manual intervention
      await supabase
        .from('orders')
        .update({
          status: 'pending_esim',
          metadata: {
            ...order.metadata,
            roamify_failed: true,
            roamify_error: roamifyError instanceof Error ? roamifyError.message : String(roamifyError),
            requires_manual_intervention: true,
            thank_you_email_sent: true,
            delay_notification_sent: true
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      logger.error(`❌ Order ${orderId} marked for manual intervention due to Roamify failure`);
      return; // Exit early
    }
    
    const esimId = roamifyOrder.esimId;
    logger.info(`🔍 Checking eSIM ID for QR code generation`, {
      orderId,
      esimId,
      hasEsimId: !!esimId,
      esimIdLength: esimId ? esimId.length : 0,
      roamifyOrderId: roamifyOrder.orderId,
    });
    
    // VALIDATION: Only proceed if we have a valid eSIM ID
    if (!esimId || esimId === '' || esimId === 'PENDING') {
      logger.error(`❌ Invalid eSIM ID received from Roamify`, {
        orderId,
        esimId,
        roamifyOrderId: roamifyOrder.orderId,
        packageId,
        paymentIntentId: paymentIntent.id,
      });
      
      // Mark order as failed and don't send email
      await supabase
        .from('orders')
        .update({
          metadata: {
            ...order.metadata,
            invalid_esim_id: true,
            esim_id_received: esimId,
            requires_manual_intervention: true
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      throw new Error(`Invalid eSIM ID received from Roamify: ${esimId}`);
    }
    
    // Update order with valid eSIM data
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        esim_code: esimId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      logger.error('❌ Error updating order with eSIM data:', updateError, {
        orderId,
        packageId,
        roamifyOrderId: roamifyOrder.orderId,
        esimId,
      });
      throw new Error(`Failed to update order with eSIM data: ${updateError.message}`);
    }

    logger.info(`💾 Order updated with eSIM code: ${esimId}`);

    // ICCID retrieval will be moved to after QR code generation is successful

    // STEP 1: Send immediate thank you email
    logger.info(`📧 Sending immediate thank you email before QR code generation`);
    await sendThankYouEmail(order, paymentIntent, metadata);
    
    // STEP 2: Poll for QR code with 5-minute timeout
    logger.info(`🔧 Starting QR code generation with 5-minute polling for eSIM: ${esimId}`);
    
    try {
      const qrData = await RoamifyService.getQrCodeWithPolling5Min(esimId);
      
      // VERIFICATION: Log the real QR code data received from Roamify
      logger.info(`🔍 REAL QR code data received from Roamify`, {
        orderId,
        esimId,
        hasQrCodeUrl: !!qrData.qrCodeUrl,
        hasLpaCode: !!qrData.lpaCode,
        hasActivationCode: !!qrData.activationCode,
        lpaCodePreview: qrData.lpaCode ? `${qrData.lpaCode.substring(0, 50)}...` : 'none',
        activationCodePreview: qrData.activationCode ? `${qrData.activationCode.substring(0, 20)}...` : 'none',
        qrCodeUrlPreview: qrData.qrCodeUrl ? `${qrData.qrCodeUrl.substring(0, 50)}...` : 'none',
        isRealLPA: qrData.lpaCode && qrData.lpaCode.includes('LPA:'),
        dataSource: 'ROAMIFY_API'
      });
      
      // VALIDATION: Check if QR data is valid before proceeding
      if (!isValidEsimProfile(qrData)) {
        logger.warn(`❌ Invalid QR profile received after polling. Setting status to pending_qr.`, {
          orderId,
          esimId,
          qrData,
        });
        // Set order status to pending_qr
        await supabase
          .from('orders')
          .update({
            status: 'pending_qr',
            metadata: {
              ...order.metadata,
              pending_qr: true,
              qr_data_received: qrData,
              requires_qr_retry: true,
              thank_you_email_sent: true
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        
        logger.error(`❌ Order ${orderId} set to pending_qr status - background process needed`);
        return; // Exit without sending second email
      }
      
      // Update order with QR code data
      await supabase
        .from('orders')
        .update({
          qr_code_data: qrData.lpaCode || qrData.activationCode,
          qr_code_url: qrData.qrCodeUrl,
          status: 'completed',
          metadata: {
            ...order.metadata,
            thank_you_email_sent: true,
            qr_code_ready: true
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      // Update user_orders with QR code URL and ICCID if entry exists
      if (userOrder && userOrder.id) {
        const userOrderUpdateData: any = {
          qr_code_url: qrData.qrCodeUrl,
          updated_at: new Date().toISOString(),
        };
        
        // Add ICCID if it was retrieved
        if (iccid) {
          userOrderUpdateData.iccid = iccid;
        }
        
        await supabase
          .from('user_orders')
          .update(userOrderUpdateData)
          .eq('id', userOrder.id);
        logger.info(`✅ Updated user_orders with QR code URL and ICCID`, { 
          orderId, 
          userOrderId: userOrder.id,
          hasIccid: !!iccid,
          iccid: iccid || 'not_retrieved'
        });
      } else {
        logger.warn(`⚠️ Skipping user_orders QR code update - no user_orders entry exists`, { orderId });
      }
      
      logger.info(`✅ QR code data saved to database`);
      
      // NEW: Retrieve ICCID after QR code generation is successful (eSIM is fully activated)
      let iccid: string | null = null;
      try {
        logger.info(`🔍 [ICCID DEBUG] Starting ICCID retrieval for eSIM UUID: ${esimId} (after QR code generation)`);
        const iccidData = await RoamifyService.getEsimIccid(esimId);
        logger.info(`🔍 [ICCID DEBUG] ICCID data received:`, iccidData);
        
        if (iccidData && iccidData.iccid && iccidData.iccid.startsWith("89")) {
          iccid = iccidData.iccid;
          logger.info(`✅ [ICCID DEBUG] ICCID retrieved successfully: ${iccid}`);
          
          // Update order with ICCID
          const { error: iccidUpdateError } = await supabase
            .from('orders')
            .update({
              iccid: iccid,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (iccidUpdateError) {
            logger.error('❌ Error updating order with ICCID:', iccidUpdateError, {
              orderId,
              iccid,
              esimId,
            });
          } else {
            logger.info(`✅ Order updated with ICCID: ${iccid}`);
          }
        } else {
          logger.error(`❌ [ICCID DEBUG] ICCID retrieval failed or returned non-ICCID value for eSIM ${esimId}:`, iccidData);
          iccid = null;
        }
      } catch (iccidError) {
        logger.error(`❌ [ICCID DEBUG] Failed to retrieve ICCID for eSIM ${esimId}:`, iccidError);
        // Continue without ICCID - it can be retrieved later
        iccid = null;
      }
      
      // STEP 3: Send confirmation email with QR code only when ready
      logger.info(`📧 Sending second email with REAL QR code data from Roamify`, {
        orderId,
        esimId,
        realQrData: {
          hasLpaCode: !!qrData.lpaCode,
          hasQrCodeUrl: !!qrData.qrCodeUrl,
          lpaCodeLength: qrData.lpaCode ? qrData.lpaCode.length : 0,
          isValidLPA: qrData.lpaCode && qrData.lpaCode.includes('LPA:'),
        }
      });
      
      await sendConfirmationEmail(order, paymentIntent, {
        ...metadata,
        esimProfile: qrData,
        esimId: esimId,
        iccid: iccid, // Pass the retrieved ICCID
      });
      
      logger.info(`✅ Two-step email flow completed successfully with REAL Roamify QR code`, {
        orderId,
        packageId,
        roamifyOrderId: roamifyOrder.orderId,
        esimId,
        realQrCodeUsed: true,
        qrCodeSource: 'ROAMIFY_API',
        hasRealLpaCode: !!qrData.lpaCode,
        hasRealQrCodeUrl: !!qrData.qrCodeUrl,
        thankYouEmailSent: true,
        confirmationEmailSent: true,
        paymentIntentId: paymentIntent.id,
      });
      
    } catch (profileError) {
      logger.error('❌ Error during 5-minute QR code polling:', profileError, {
        orderId,
        esimId,
        error: profileError instanceof Error ? profileError.message : String(profileError),
        stack: profileError instanceof Error ? profileError.stack : undefined,
      });
      
      // Check if this is a timeout error
      const isTimeout = profileError instanceof Error && profileError.message.includes('5 minutes');
      
      if (isTimeout) {
        // Set order status to pending_qr for background retry
        await supabase
          .from('orders')
          .update({
            status: 'pending_qr',
            metadata: {
              ...order.metadata,
              qr_code_timeout: true,
              qr_code_error: profileError.message,
              requires_background_retry: true,
              thank_you_email_sent: true,
              timeout_occurred_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        
        logger.error(`❌ QR code timeout for order ${orderId} - set to pending_qr for background retry`);
        return; // Exit gracefully - background process can retry later
      } else {
        // Other QR generation error
        await supabase
          .from('orders')
          .update({
            metadata: {
              ...order.metadata,
              qr_code_generation_failed: true,
              qr_code_error: profileError instanceof Error ? profileError.message : String(profileError),
              requires_manual_qr_generation: true,
              thank_you_email_sent: true
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        
        logger.error(`❌ QR code generation failed for order ${orderId} - manual intervention required`);
        throw new Error(`QR code generation failed for eSIM ${esimId}: ${profileError instanceof Error ? profileError.message : String(profileError)}`);
      }
    }

  } catch (esimError) {
    logger.error('❌ Error in eSIM delivery process:', esimError, {
      orderId,
      packageId,
      paymentIntentId: paymentIntent.id,
      error: esimError instanceof Error ? esimError.message : String(esimError),
      stack: esimError instanceof Error ? esimError.stack : undefined,
    });
    
    // Mark order as failed in database
    await supabase
      .from('orders')
      .update({
        status: 'failed',
        metadata: {
          ...order.metadata,
          delivery_failed: true,
          delivery_error: esimError instanceof Error ? esimError.message : String(esimError),
          requires_admin_intervention: true
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    
    // DO NOT send email if eSIM delivery fails completely
    logger.error(`❌ NOT sending email due to eSIM delivery failure for order ${orderId}`);
    
    // Re-throw the error to be handled by calling function
    throw esimError;
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
    let iccid: string | null = null; // Declare iccid here

    try {
      // --- EXACT ROAMIFY SLUG LOGIC ---
      if (!packageData.slug) {
        logger.error(`❌ No slug found for package: ${packageId}. Package data:`, {
          packageId: packageData.id,
          name: packageData.name,
          hasSlug: !!packageData.slug,
        });
        throw new Error(`No Roamify slug found for package: ${packageId}. Package may not be properly configured for eSIM delivery.`);
      }

      const roamifyPackageId = packageData.slug;
      logger.info(`📦 Using exact Roamify slug: ${roamifyPackageId}`);
      // --- END EXACT ROAMIFY SLUG LOGIC ---

      logger.info(`Creating Roamify order for package: ${packageData.name} (Roamify slug: ${roamifyPackageId})`);
      
      const roamifyOrder = await RoamifyService.createEsimOrder(roamifyPackageId, 1);
      esimCode = roamifyOrder.esimId;
      roamifyOrderId = roamifyOrder.orderId;
      
      // Generate real QR code
      realQRData = await RoamifyService.getQrCodeWithPolling(esimCode);
      
      // Step 1.5: Retrieve ICCID using the UUID
      try {
        logger.info(`Retrieving ICCID for eSIM UUID: ${esimCode}`);
        const iccidData = await RoamifyService.getEsimIccid(esimCode);
        if (iccidData && iccidData.iccid && iccidData.iccid.startsWith("89")) {
          iccid = iccidData.iccid;
          logger.info(`ICCID retrieved successfully: ${iccid}`);
        } else {
          logger.error(`ICCID retrieval failed or returned non-ICCID value for eSIM ${esimCode}:`, iccidData);
          iccid = null;
        }
      } catch (iccidError) {
        logger.error(`Failed to retrieve ICCID for eSIM ${esimCode}:`, iccidError);
        // Continue without ICCID - it can be retrieved later
        iccid = null;
      }
      
      logger.info(`Real eSIM created. Order ID: ${roamifyOrderId}, eSIM ID: ${esimCode}, ICCID: ${iccid || 'not retrieved'}`);
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
      iccid: iccid || undefined, // Add ICCID to order data
      qr_code_data: realQRData.lpaCode,
      qr_code_url: realQRData.qrCodeUrl || '',
      roamify_order_id: roamifyOrderId,
      status: 'paid',
      amount: amount,
      data_amount: packageData.data_amount,
      data_used: 0, // Initialize data usage to 0
      days: packageData.days,
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
    
    // Step 3: Two-step email flow for checkout completion
    if (customerEmail) {
      logger.info(`[EMAIL DEBUG] Starting two-step email flow for checkout completion to ${customerEmail} for order ${order.id}`);
      
      // Step 3a: Send immediate thank you email
      try {
        await sendEmail({
          to: customerEmail,
          subject: emailTemplates.thankYou.subject,
          html: async () => emailTemplates.thankYou.html({
            orderId: order.id,
            packageName: packageData.name,
            amount: amount,
            dataAmount: `${packageData.data_amount}GB`,
            days: packageData.days,
            name,
            surname,
            email: customerEmail,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          }),
        });
        logger.info(`[EMAIL DEBUG] ✅ Thank you email sent to ${customerEmail} for order ${order.id}`);
      } catch (emailError) {
        logger.error(`[EMAIL DEBUG] ❌ Error sending thank you email to ${customerEmail} for order ${order.id}:`, emailError);
      }
      
      // Step 3b: Send QR code email (since QR code is already available)
      try {
        await sendEmail({
          to: customerEmail,
          subject: emailTemplates.orderConfirmation.subject,
          html: async () => emailTemplates.orderConfirmation.html({
            orderId: order.id,
            packageName: packageData.name,
            amount: amount,
            dataAmount: `${packageData.data_amount}GB`,
            days: packageData.days,
            esimCode: esimCode,
            iccid: iccid || undefined, // Add ICCID to email template
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
        logger.info(`[EMAIL DEBUG] ✅ QR code confirmation email sent to ${customerEmail} for order ${order.id}`);
      } catch (emailError) {
        logger.error(`[EMAIL DEBUG] ❌ Error sending QR code email to ${customerEmail} for order ${order.id}:`, emailError);
      }
    } else {
      logger.error(`[EMAIL DEBUG] ❌ No customerEmail found for order ${order.id}. Full session:`, JSON.stringify(session, null, 2));
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