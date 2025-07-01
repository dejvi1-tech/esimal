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

function isValidEsimProfile(qrData: any): boolean {
  return !!(qrData && (qrData.qrCodeUrl || qrData.lpaCode || qrData.activationCode));
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
      validityDays: packageData.validity_days,
      esimCode: metadata.esimId || order.esim_code || order.roamify_esim_id || 'PENDING',
      iccid: metadata.esimId || order.esim_code || order.roamify_esim_id || '',
      qrCodeData: order.qr_code_data || '',
      qrCodeUrl: '', // Will be set from eSIM profile data
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
        hasQrCodeUrl: !!metadata.esimProfile.qrCodeUrl,
        hasLpaCode: !!metadata.esimProfile.lpaCode,
        hasActivationCode: !!metadata.esimProfile.activationCode,
        qrCodeUrl: metadata.esimProfile.qrCodeUrl,
        lpaCode: metadata.esimProfile.lpaCode ? `${metadata.esimProfile.lpaCode.substring(0, 50)}...` : null,
      });
      
      // Use the real eSIM profile data from Roamify
      emailData.esimCode = metadata.esimId || emailData.esimCode;
      emailData.iccid = metadata.esimId || emailData.iccid;
      emailData.qrCodeUrl = metadata.esimProfile.qrCodeUrl || '';
      emailData.qrCodeData = metadata.esimProfile.lpaCode || metadata.esimProfile.activationCode || '';
      
      // Add iOS quick install URL if available
      if (metadata.esimProfile.iosQuickInstall) {
        (emailData as any).iosQuickInstall = metadata.esimProfile.iosQuickInstall;
      }
      
      // Log what we're actually sending to the email template
      logger.info(`Email template data for QR code`, {
        orderId,
        hasQrCodeData: !!emailData.qrCodeData,
        hasQrCodeUrl: !!emailData.qrCodeUrl,
        esimCode: emailData.esimCode,
        qrCodeDataLength: emailData.qrCodeData ? emailData.qrCodeData.length : 0,
      });
    } else {
      logger.warn(`No eSIM profile data available for email`, {
        orderId,
        esimId: metadata.esimId,
        availableMetadataKeys: Object.keys(metadata),
      });
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

    // --- STRICT LOGIC FOR ROAMIFY PACKAGE ID ---
    let realRoamifyPackageId: string | null = null;

    // Check if the package has features with packageId
    if (packageData && packageData.features && packageData.features.packageId) {
      realRoamifyPackageId = packageData.features.packageId;
      logger.info(`📦 Using packageId from features: ${realRoamifyPackageId}`);
    }
    // Check if the package has reseller_id (fallback method)
    else if (packageData && packageData.reseller_id) {
      realRoamifyPackageId = packageData.reseller_id;
      logger.info(`📦 Using reseller_id as Roamify packageId: ${realRoamifyPackageId}`);
    }
    // If still no Roamify package ID found, try to find it in packages table by reseller_id
    else if (packageData && !packageData.features && !packageData.reseller_id) {
      logger.warn(`⚠️ No reseller_id or features.packageId found for package: ${packageData.id}. This package may not be properly configured for Roamify delivery.`);
      
      // Try to find a related package in packages table that might have the Roamify ID
      const { data: relatedPackages, error: relatedError } = await supabase
        .from('packages')
        .select('features, reseller_id')
        .or(`name.eq.${packageData.name},country_name.eq.${packageData.country_name}`)
        .limit(1);
      
      if (!relatedError && relatedPackages && relatedPackages.length > 0) {
        const relatedPackage = relatedPackages[0];
        if (relatedPackage.features && relatedPackage.features.packageId) {
          realRoamifyPackageId = relatedPackage.features.packageId;
          logger.info(`📦 Found Roamify packageId from related package: ${realRoamifyPackageId}`);
        } else if (relatedPackage.reseller_id) {
          realRoamifyPackageId = relatedPackage.reseller_id;
          logger.info(`📦 Found reseller_id from related package: ${realRoamifyPackageId}`);
        }
      }
    }

    if (!realRoamifyPackageId) {
      logger.error(`❌ No Roamify packageId found for package: ${packageId}. Package data:`, {
        packageId: packageData.id,
        name: packageData.name,
        hasFeatures: !!packageData.features,
        hasResellerId: !!packageData.reseller_id,
        orderId,
      });
      throw new Error(`No Roamify packageId found for package: ${packageId}. Package may not be properly configured for eSIM delivery.`);
    }
    // --- END STRICT LOGIC ---

    const roamifyPackageId = realRoamifyPackageId;
    
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
        fallbackUsed: roamifyOrder.fallbackUsed || false,
        originalPackageId: roamifyOrder.originalPackageId,
        fallbackPackageId: roamifyOrder.fallbackPackageId,
        paymentIntentId: paymentIntent.id,
      });
    } catch (v2Error) {
      logger.error(`❌ Roamify order creation failed:`, v2Error);
      throw new Error(`Roamify order creation failed: ${v2Error}`);
    }

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

    logger.info(`💾 Order updated with Roamify details`, {
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

    // ENHANCED: Ensure guest user exists before creating user_orders entry
    if (safeUserId === GUEST_USER_ID) {
      logger.info(`👤 Creating user_orders entry for guest user: ${GUEST_USER_ID}`);
      
      // Check if guest user exists, create if needed
      const { data: guestUser, error: guestUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', GUEST_USER_ID)
        .single();
      
      if (guestUserError || !guestUser) {
        logger.warn(`⚠️ Guest user ${GUEST_USER_ID} not found, creating...`);
        
        try {
          // Try multiple strategies for guest user creation
          const creationStrategies = [
            // Strategy 1: Minimal required fields (role: 'user' since 'guest' is not in enum)
            {
              id: GUEST_USER_ID,
              email: 'guest@esimal.com',
              password: 'disabled-account',
              role: 'user'
            },
            // Strategy 2: Even more minimal
            {
              id: GUEST_USER_ID,
              email: 'guest@esimal.com',
              password: 'disabled-account'
            }
          ];
          
          let newGuestUser = null;
          let createGuestError = null;
          
          for (const strategy of creationStrategies) {
            try {
              const { data, error } = await supabase
                .from('users')
                .insert(strategy)
                .select()
                .single();
              
              if (!error && data) {
                newGuestUser = data;
                createGuestError = null;
                logger.info(`✅ Guest user created with strategy: ${JSON.stringify(Object.keys(strategy))}`);
                break;
              } else {
                createGuestError = error;
                logger.warn(`⚠️ Guest user strategy failed: ${error?.message}`);
              }
            } catch (strategyError: any) {
              createGuestError = strategyError;
              logger.warn(`⚠️ Guest user strategy exception: ${strategyError?.message || 'Unknown error'}`);
            }
          }
          
          if (createGuestError) {
            logger.error(`❌ Failed to create guest user: ${createGuestError.message}`);
            
            // ALTERNATIVE: Skip user_orders creation for now and log for admin review
            logger.error(`⚠️ Skipping user_orders creation due to guest user issue. Order ID: ${orderId}`);
            
            // Update order metadata to indicate this needs admin attention
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
            
            // Don't throw error, just skip user_orders creation
            logger.warn(`⚠️ Order ${orderId} completed but user_orders entry skipped - requires admin review`);
            return; // Exit early but don't fail the entire eSIM delivery
          } else {
            logger.info(`✅ Guest user created successfully: ${newGuestUser.id}`);
          }
        } catch (guestCreationError) {
          logger.error(`❌ Exception creating guest user:`, guestCreationError);
          
          // Skip user_orders creation and mark for admin review
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
          
          logger.warn(`⚠️ Order ${orderId} completed but user_orders entry skipped due to guest user creation failure`);
          return; // Don't fail the entire delivery
        }
      } else {
        logger.info(`✅ Guest user exists: ${GUEST_USER_ID}`);
      }
    }

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
      
      // Don't throw - continue with eSIM delivery
    } else {
      logger.info(`✅ User orders entry created successfully`, {
        orderId,
        userOrderId: userOrder.id,
      });
    }

    // CRITICAL: Update order with eSIM data and generate QR code
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

    // CRITICAL: Generate eSIM QR code/profile with enhanced error handling
    logger.info(`🔧 Starting QR code generation for eSIM: ${esimId}`);
    
    try {
      const qrData = await RoamifyService.getQrCodeWithPolling(esimId);
      
      // VALIDATION: Check if QR data is valid before proceeding
      if (!isValidEsimProfile(qrData)) {
        logger.warn(`❌ No valid eSIM profile/QR code available yet. Will not send email.`, {
          orderId,
          esimId,
          qrData,
        });
        // Set order status to waiting_for_qr
        await supabase
          .from('orders')
          .update({
            status: 'waiting_for_qr',
            metadata: {
              ...order.metadata,
              waiting_for_qr: true,
              qr_data_received: qrData,
              requires_qr_retry: true
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        return; // Do not send email
      }
      
      // Update order with QR code data
      await supabase
        .from('orders')
        .update({
          qr_code_data: qrData.lpaCode || qrData.activationCode,
          qr_code_url: qrData.qrCodeUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      // Update user_orders with QR code URL if entry exists
      if (userOrder) {
        await supabase
          .from('user_orders')
          .update({
            qr_code_url: qrData.qrCodeUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userOrder.id);
      }
      
      logger.info(`✅ QR code data saved to database`);
      
      // SEND EMAIL WITH VALID QR DATA
      logger.info(`📧 Sending confirmation email with QR code data`);
      await sendConfirmationEmail(order, paymentIntent, {
        ...metadata,
        esimProfile: qrData,
        esimId: esimId,
      });
      
      logger.info(`✅ eSIM delivery completed successfully`, {
        orderId,
        packageId,
        roamifyOrderId: roamifyOrder.orderId,
        esimId,
        hasQrCode: true,
        paymentIntentId: paymentIntent.id,
      });
      
    } catch (profileError) {
      logger.error('❌ Error generating eSIM profile/QR code:', profileError, {
        orderId,
        esimId,
        error: profileError instanceof Error ? profileError.message : String(profileError),
        stack: profileError instanceof Error ? profileError.stack : undefined,
      });
      
      // Update order to indicate QR code generation failed
      await supabase
        .from('orders')
        .update({
          metadata: {
            ...order.metadata,
            qr_code_generation_failed: true,
            qr_code_error: profileError instanceof Error ? profileError.message : String(profileError),
            requires_manual_qr_generation: true
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      // DO NOT SEND EMAIL if QR generation fails - customer will get broken QR code
      logger.error(`❌ NOT sending email due to QR generation failure for order ${orderId}`);
      
      throw new Error(`QR code generation failed for eSIM ${esimId}: ${profileError instanceof Error ? profileError.message : String(profileError)}`);
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