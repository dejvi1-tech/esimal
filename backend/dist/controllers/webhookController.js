"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const stripeService_1 = __importDefault(require("../services/stripeService"));
const supabase_1 = require("../config/supabase");
const logger_1 = require("../utils/logger");
const emailService_1 = require("../services/emailService");
const emailTemplates_1 = require("../utils/emailTemplates");
const roamifyService_1 = require("../services/roamifyService");
const esimUtils_1 = require("../utils/esimUtils");
/**
 * Handle Stripe webhook events
 */
const handleStripeWebhook = (req, res, next) => {
    (async () => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            logger_1.logger.error('STRIPE_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }
        let event;
        try {
            event = stripeService_1.default.constructWebhookEvent(req.body, sig, webhookSecret);
        }
        catch (err) {
            logger_1.logger.error('Webhook signature verification failed:', err.message);
            return res.status(400).json({ error: 'Invalid signature' });
        }
        try {
            // Log the entire webhook event for debugging
            logger_1.logger.info(`Received Stripe webhook event: ${event.type}`, {
                eventId: event.id,
                eventType: event.type,
                eventData: JSON.stringify(event.data.object),
            });
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
                    logger_1.logger.info(`Unhandled event type: ${event.type}`);
            }
            res.json({ received: true });
        }
        catch (error) {
            logger_1.logger.error('Error handling webhook:', error);
            res.status(500).json({ error: 'Webhook handler failed' });
        }
    })();
};
exports.handleStripeWebhook = handleStripeWebhook;
/**
 * Handle successful payment intent with comprehensive logging
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    const paymentIntentId = paymentIntent.id;
    const metadata = paymentIntent.metadata;
    logger_1.logger.info(`Payment succeeded: ${paymentIntentId}`, {
        paymentIntentId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customerId: paymentIntent.customer,
        metadata: JSON.stringify(metadata),
    });
    try {
        // Update order status to paid
        const { data: order, error: orderError } = await supabase_1.supabase
            .from('orders')
            .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
        })
            .eq('payment_intent_id', paymentIntentId)
            .select()
            .single();
        if (orderError) {
            logger_1.logger.error('Error updating order status:', orderError, { paymentIntentId });
            return;
        }
        if (!order) {
            logger_1.logger.error('Order not found for payment intent:', paymentIntentId);
            return;
        }
        logger_1.logger.info(`Order updated successfully: ${order.id}`, { orderId: order.id, paymentIntentId });
        // Deliver eSIM with comprehensive logging first
        if (metadata.packageId) {
            await deliverEsim(order, paymentIntent, metadata);
        }
        else {
            logger_1.logger.warn('No package ID found in payment intent metadata', { paymentIntentId });
        }
        // Send confirmation email with comprehensive logging after eSIM delivery
        if (metadata.email) {
            await sendConfirmationEmail(order, paymentIntent, metadata);
        }
        else {
            logger_1.logger.warn('No email found in payment intent metadata', { paymentIntentId });
        }
    }
    catch (error) {
        logger_1.logger.error('Error handling payment success:', error, { paymentIntentId });
    }
}
/**
 * Send confirmation email with comprehensive logging
 */
async function sendConfirmationEmail(order, paymentIntent, metadata) {
    const orderId = order.id;
    const email = order.guest_email || metadata.email;
    const packageId = metadata.packageId;
    logger_1.logger.info(`Starting email confirmation process`, {
        orderId,
        email,
        packageId,
        paymentIntentId: paymentIntent.id,
    });
    try {
        // Get package details for the email
        const { data: packageData, error: packageError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        if (packageError || !packageData) {
            logger_1.logger.error('Package not found for email confirmation:', packageError, { packageId });
            throw new Error(`Package not found: ${packageId}`);
        }
        // Log before sending email
        logger_1.logger.info(`Sending confirmation email`, {
            orderId,
            email,
            packageId,
            paymentIntentId: paymentIntent.id,
        });
        await (0, emailService_1.sendEmail)({
            to: email,
            subject: emailTemplates_1.emailTemplates.orderConfirmation.subject,
            html: async () => emailTemplates_1.emailTemplates.orderConfirmation.html({
                orderId: orderId,
                amount: paymentIntent.amount / 100,
                packageName: metadata.packageName || packageData.name,
                dataAmount: `${packageData.data_amount}GB`,
                validityDays: packageData.validity_days,
                esimCode: order.esim_code || 'PENDING',
                qrCodeData: order.qr_code_data || '',
                qrCodeUrl: '', // Will be generated by the template
                isGuestOrder: true,
                signupUrl: `${process.env.FRONTEND_URL}/signup`,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
                name: metadata.name || '',
                surname: metadata.surname || '',
                email: email,
            }),
        });
        // Log successful email send
        logger_1.logger.info(`Confirmation email sent successfully`, {
            orderId,
            email,
            packageId,
            paymentIntentId: paymentIntent.id,
        });
    }
    catch (emailError) {
        logger_1.logger.error('Error sending confirmation email:', emailError, {
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
async function deliverEsim(order, paymentIntent, metadata) {
    const orderId = order.id;
    const packageId = metadata.packageId;
    const email = metadata.email;
    logger_1.logger.info(`Starting eSIM delivery process`, {
        orderId,
        packageId,
        email,
        paymentIntentId: paymentIntent.id,
    });
    try {
        // Get package details to get the reseller_id
        const { data: packageData, error: packageError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        if (packageError || !packageData) {
            logger_1.logger.error('Package not found for eSIM delivery:', packageError, {
                packageId,
                orderId,
                paymentIntentId: paymentIntent.id,
                metadata: metadata
            });
            throw new Error(`Package not found: ${packageId}`);
        }
        const resellerId = packageData.reseller_id;
        if (!resellerId) {
            logger_1.logger.error('Package found but no reseller_id:', {
                packageId,
                packageName: packageData.name,
                orderId,
                paymentIntentId: paymentIntent.id
            });
            throw new Error(`No reseller_id found for package: ${packageId}`);
        }
        logger_1.logger.info(`Found package data for eSIM delivery`, {
            orderId,
            packageId,
            resellerId,
            packageName: packageData.name,
            paymentIntentId: paymentIntent.id,
        });
        // Log eSIM API request
        logger_1.logger.info(`Requesting eSIM from Roamify API`, {
            orderId,
            packageId,
            resellerId,
            paymentIntentId: paymentIntent.id,
        });
        // Create eSIM order with Roamify using reseller_id
        const roamifyOrder = await roamifyService_1.RoamifyService.createEsimOrder(resellerId, 1);
        logger_1.logger.info(`Roamify order created successfully`, {
            orderId,
            packageId,
            resellerId,
            roamifyOrderId: roamifyOrder.orderId,
            esimId: roamifyOrder.esimId,
            paymentIntentId: paymentIntent.id,
        });
        // Generate real QR code
        const realQRData = await roamifyService_1.RoamifyService.generateRealQRCode(roamifyOrder.esimId);
        logger_1.logger.info(`Real QR code generated successfully`, {
            orderId,
            packageId,
            resellerId,
            roamifyOrderId: roamifyOrder.orderId,
            esimId: roamifyOrder.esimId,
            paymentIntentId: paymentIntent.id,
        });
        // Update order with eSIM data
        const { error: updateError } = await supabase_1.supabase
            .from('orders')
            .update({
            esim_code: roamifyOrder.esimId,
            updated_at: new Date().toISOString(),
        })
            .eq('id', orderId);
        if (updateError) {
            logger_1.logger.error('Error updating order with eSIM data:', updateError, {
                orderId,
                packageId,
                resellerId,
                roamifyOrderId: roamifyOrder.orderId,
                esimId: roamifyOrder.esimId,
            });
        }
        else {
            logger_1.logger.info(`eSIM delivered successfully`, {
                orderId,
                packageId,
                resellerId,
                roamifyOrderId: roamifyOrder.orderId,
                esimId: roamifyOrder.esimId,
                paymentIntentId: paymentIntent.id,
            });
        }
    }
    catch (esimError) {
        logger_1.logger.error('Error delivering eSIM:', esimError, {
            orderId,
            packageId,
            paymentIntentId: paymentIntent.id,
        });
    }
}
/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
    logger_1.logger.info(`Payment failed: ${paymentIntent.id}`);
    try {
        // Update order status to failed
        await supabase_1.supabase
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
                await (0, emailService_1.sendEmail)({
                    to: paymentIntent.metadata.userEmail,
                    subject: emailTemplates_1.emailTemplates.paymentFailed.subject,
                    html: async () => emailTemplates_1.emailTemplates.paymentFailed.html({
                        amount: paymentIntent.amount / 100,
                        packageName: paymentIntent.metadata.packageName || 'eSIM Package',
                        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
                        retryUrl: `${process.env.FRONTEND_URL}/checkout?retry=true`,
                    }),
                });
                logger_1.logger.info(`Payment failure email sent to ${paymentIntent.metadata.userEmail}`);
            }
            catch (emailError) {
                logger_1.logger.error('Error sending payment failure email:', emailError);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error handling payment failure:', error);
    }
}
/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(paymentIntent) {
    logger_1.logger.info(`Payment canceled: ${paymentIntent.id}`);
    try {
        // Update order status to canceled
        await supabase_1.supabase
            .from('orders')
            .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
        })
            .eq('stripe_payment_intent_id', paymentIntent.id);
        // Send cancellation notification email
        if (paymentIntent.metadata.userEmail) {
            try {
                await (0, emailService_1.sendEmail)({
                    to: paymentIntent.metadata.userEmail,
                    subject: emailTemplates_1.emailTemplates.paymentCanceled.subject,
                    html: async () => emailTemplates_1.emailTemplates.paymentCanceled.html({
                        amount: paymentIntent.amount / 100,
                        packageName: paymentIntent.metadata.packageName || 'eSIM Package',
                        retryUrl: `${process.env.FRONTEND_URL}/checkout?retry=true`,
                    }),
                });
                logger_1.logger.info(`Payment cancellation email sent to ${paymentIntent.metadata.userEmail}`);
            }
            catch (emailError) {
                logger_1.logger.error('Error sending payment cancellation email:', emailError);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error handling payment cancellation:', error);
    }
}
/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session) {
    logger_1.logger.info(`Checkout session completed: ${session.id}`);
    try {
        const { packageId, name, surname } = session.metadata;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const amount = session.amount_total / 100;
        // Get package details
        const { data: packageData, error: packageError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        if (packageError || !packageData) {
            logger_1.logger.error('Package not found for checkout session:', packageId);
            return;
        }
        // Step 1: Create real eSIM with Roamify API
        let esimCode;
        let roamifyOrderId;
        let realQRData;
        try {
            logger_1.logger.info(`Creating Roamify order for package: ${packageData.name} (${packageData.reseller_id})`);
            const roamifyOrder = await roamifyService_1.RoamifyService.createEsimOrder(packageData.reseller_id, 1);
            esimCode = roamifyOrder.esimId;
            roamifyOrderId = roamifyOrder.orderId;
            // Generate real QR code
            realQRData = await roamifyService_1.RoamifyService.generateRealQRCode(esimCode);
            logger_1.logger.info(`Real eSIM created. Order ID: ${roamifyOrderId}, eSIM ID: ${esimCode}`);
        }
        catch (roamifyError) {
            logger_1.logger.error('Failed to create Roamify order, using fallback:', roamifyError);
            // Fallback: Generate local eSIM code
            esimCode = await (0, esimUtils_1.generateEsimCode)();
            roamifyOrderId = `fallback-${Date.now()}`;
            realQRData = {
                lpaCode: (0, esimUtils_1.generateQRCodeData)(esimCode, packageData.name),
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
        const { data: order, error: orderError } = await supabase_1.supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        if (orderError) {
            logger_1.logger.error('Error creating order after checkout:', orderError);
            return;
        }
        logger_1.logger.info(`Order created successfully: ${order.id}`);
        // Step 3: Send confirmation email with real eSIM data
        if (customerEmail) {
            try {
                await (0, emailService_1.sendEmail)({
                    to: customerEmail,
                    subject: emailTemplates_1.emailTemplates.orderConfirmation.subject,
                    html: async () => emailTemplates_1.emailTemplates.orderConfirmation.html({
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
                logger_1.logger.info(`Order confirmation email sent to ${customerEmail} for order ${order.id}`);
            }
            catch (emailError) {
                logger_1.logger.error('Error sending checkout success email:', emailError);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error handling checkout session completion:', error);
    }
}
/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge) {
    logger_1.logger.info(`Charge refunded: ${charge.id}`);
    try {
        // Update order status to refunded
        await supabase_1.supabase
            .from('orders')
            .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            stripe_refund_id: charge.refunds?.data[0]?.id
        })
            .eq('stripe_payment_intent_id', charge.payment_intent);
        // Send refund notification email
        const { data: order } = await supabase_1.supabase
            .from('orders')
            .select('user_email, packageId')
            .eq('stripe_payment_intent_id', charge.payment_intent)
            .single();
        if (order?.user_email) {
            try {
                await (0, emailService_1.sendEmail)({
                    to: order.user_email,
                    subject: emailTemplates_1.emailTemplates.refundProcessed.subject,
                    html: async () => emailTemplates_1.emailTemplates.refundProcessed.html({
                        amount: charge.amount_refunded / 100,
                        refundId: charge.refunds?.data[0]?.id,
                        orderId: order.packageId,
                    }),
                });
                logger_1.logger.info(`Refund email sent to ${order.user_email}`);
            }
            catch (emailError) {
                logger_1.logger.error('Error sending refund email:', emailError);
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error handling charge refunded:', error);
    }
}
/**
 * Handle subscription created (for future use)
 */
async function handleSubscriptionCreated(subscription) {
    logger_1.logger.info(`Subscription created: ${subscription.id}`);
    // Implement subscription handling logic here
}
/**
 * Handle subscription updated (for future use)
 */
async function handleSubscriptionUpdated(subscription) {
    logger_1.logger.info(`Subscription updated: ${subscription.id}`);
    // Implement subscription update logic here
}
/**
 * Handle subscription deleted (for future use)
 */
async function handleSubscriptionDeleted(subscription) {
    logger_1.logger.info(`Subscription deleted: ${subscription.id}`);
    // Implement subscription deletion logic here
}
//# sourceMappingURL=webhookController.js.map