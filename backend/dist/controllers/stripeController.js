"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = exports.getCustomer = exports.detachPaymentMethod = exports.attachPaymentMethod = exports.getCustomerPaymentMethods = exports.createRefund = exports.getPaymentIntentStatus = exports.confirmPayment = exports.createPaymentIntent = void 0;
const stripeService_1 = __importDefault(require("../services/stripeService"));
const supabase_1 = require("../config/supabase");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-05-28.basil' });
/**
 * Create a payment intent for a package purchase
 */
const createPaymentIntent = async (req, res, next) => {
    try {
        const { packageId, userEmail, userName, userId } = req.body;
        // Validate required fields
        if (!packageId) {
            throw new errors_1.ValidationError('Package ID is required');
        }
        if (!userEmail) {
            throw new errors_1.ValidationError('User email is required');
        }
        // Get package details
        const { data: packageData, error: packageError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        if (packageError || !packageData) {
            throw new errors_1.NotFoundError('Package not found');
        }
        // Create or retrieve Stripe customer
        const customerData = {
            email: userEmail,
            name: userName,
            metadata: {
                userId: userId || 'guest',
                packageId: packageId,
            },
        };
        const customer = await stripeService_1.default.createOrRetrieveCustomer(customerData);
        // Create payment intent
        const paymentIntentData = {
            amount: packageData.sale_price,
            currency: 'usd', // You can make this configurable
            customerId: customer.id,
            metadata: {
                packageId: packageId,
                packageName: packageData.name,
                userId: userId || 'guest',
                userEmail: userEmail,
            },
            description: `eSIM Package: ${packageData.name} - ${packageData.data_amount}GB for ${packageData.validity_days} days`,
        };
        const paymentIntent = await stripeService_1.default.createPaymentIntent(paymentIntentData);
        res.status(200).json({
            status: 'success',
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount / 100, // Convert back from cents
                currency: paymentIntent.currency,
                customerId: customer.id,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createPaymentIntent = createPaymentIntent;
/**
 * Confirm a payment intent
 */
const confirmPayment = async (req, res, next) => {
    try {
        const { paymentIntentId, paymentMethodId } = req.body;
        if (!paymentIntentId) {
            throw new errors_1.ValidationError('Payment intent ID is required');
        }
        if (!paymentMethodId) {
            throw new errors_1.ValidationError('Payment method ID is required');
        }
        const paymentIntent = await stripeService_1.default.confirmPaymentIntent(paymentIntentId, paymentMethodId);
        if (paymentIntent.status === 'succeeded') {
            // Payment successful - create order
            const metadata = paymentIntent.metadata;
            const packageId = metadata.packageId;
            const userEmail = metadata.userEmail;
            const userId = metadata.userId;
            // Get package details
            const { data: packageData } = await supabase_1.supabase
                .from('my_packages')
                .select('*')
                .eq('id', packageId)
                .single();
            if (packageData) {
                // Create order in database
                const orderData = {
                    packageId: packageId,
                    user_id: userId === 'guest' ? null : userId,
                    user_email: userEmail,
                    user_name: metadata.userName || userEmail,
                    status: 'paid',
                    amount: paymentIntent.amount / 100,
                    stripe_payment_intent_id: paymentIntentId,
                    stripe_customer_id: paymentIntent.customer,
                    created_at: new Date().toISOString(),
                };
                const { data: order, error: orderError } = await supabase_1.supabase
                    .from('orders')
                    .insert([orderData])
                    .select()
                    .single();
                if (orderError) {
                    logger_1.logger.error('Error creating order after payment:', orderError);
                }
                else {
                    logger_1.logger.info(`Order created successfully: ${order.id}`);
                }
            }
            res.status(200).json({
                status: 'success',
                message: 'Payment confirmed successfully',
                data: {
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount / 100,
                },
            });
        }
        else {
            throw new errors_1.PaymentError('Payment confirmation failed');
        }
    }
    catch (error) {
        next(error);
    }
};
exports.confirmPayment = confirmPayment;
/**
 * Get payment intent status
 */
const getPaymentIntentStatus = async (req, res, next) => {
    try {
        const { paymentIntentId } = req.params;
        if (!paymentIntentId) {
            throw new errors_1.ValidationError('Payment intent ID is required');
        }
        const paymentIntent = await stripeService_1.default.retrievePaymentIntent(paymentIntentId);
        res.status(200).json({
            status: 'success',
            data: {
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                customerId: paymentIntent.customer,
                metadata: paymentIntent.metadata,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentIntentStatus = getPaymentIntentStatus;
/**
 * Create a refund
 */
const createRefund = async (req, res, next) => {
    try {
        const { paymentIntentId, amount, reason } = req.body;
        if (!paymentIntentId) {
            throw new errors_1.ValidationError('Payment intent ID is required');
        }
        const refund = await stripeService_1.default.createRefund(paymentIntentId, amount, reason);
        // Update order status to refunded
        await supabase_1.supabase
            .from('orders')
            .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            stripe_refund_id: refund.id
        })
            .eq('stripe_payment_intent_id', paymentIntentId);
        res.status(200).json({
            status: 'success',
            message: 'Refund created successfully',
            data: {
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createRefund = createRefund;
/**
 * Get customer payment methods
 */
const getCustomerPaymentMethods = async (req, res, next) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            throw new errors_1.ValidationError('Customer ID is required');
        }
        const paymentMethods = await stripeService_1.default.getCustomerPaymentMethods(customerId);
        res.status(200).json({
            status: 'success',
            data: paymentMethods.map(pm => ({
                id: pm.id,
                type: pm.type,
                card: pm.card ? {
                    brand: pm.card.brand,
                    last4: pm.card.last4,
                    expMonth: pm.card.exp_month,
                    expYear: pm.card.exp_year,
                } : null,
                created: pm.created,
            })),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomerPaymentMethods = getCustomerPaymentMethods;
/**
 * Attach payment method to customer
 */
const attachPaymentMethod = async (req, res, next) => {
    try {
        const { paymentMethodId, customerId } = req.body;
        if (!paymentMethodId) {
            throw new errors_1.ValidationError('Payment method ID is required');
        }
        if (!customerId) {
            throw new errors_1.ValidationError('Customer ID is required');
        }
        const paymentMethod = await stripeService_1.default.attachPaymentMethod(paymentMethodId, customerId);
        res.status(200).json({
            status: 'success',
            message: 'Payment method attached successfully',
            data: {
                id: paymentMethod.id,
                type: paymentMethod.type,
                customerId: paymentMethod.customer,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.attachPaymentMethod = attachPaymentMethod;
/**
 * Detach payment method from customer
 */
const detachPaymentMethod = async (req, res, next) => {
    try {
        const { paymentMethodId } = req.params;
        if (!paymentMethodId) {
            throw new errors_1.ValidationError('Payment method ID is required');
        }
        const paymentMethod = await stripeService_1.default.detachPaymentMethod(paymentMethodId);
        res.status(200).json({
            status: 'success',
            message: 'Payment method detached successfully',
            data: {
                id: paymentMethod.id,
                type: paymentMethod.type,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.detachPaymentMethod = detachPaymentMethod;
/**
 * Get customer details
 */
const getCustomer = async (req, res, next) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            throw new errors_1.ValidationError('Customer ID is required');
        }
        const customer = await stripeService_1.default.getCustomer(customerId);
        res.status(200).json({
            status: 'success',
            data: {
                id: customer.id,
                email: customer.email,
                name: customer.name,
                phone: customer.phone,
                created: customer.created,
                metadata: customer.metadata,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomer = getCustomer;
const createCheckoutSession = async (req, res, next) => {
    const { packageId, email, name, surname } = req.body;
    // 1. Lookup package in Supabase
    const { data: pkg, error } = await supabase_1.supabase
        .from('my_packages')
        .select('*')
        .eq('id', packageId)
        .single();
    if (error || !pkg) {
        return res.status(404).json({ error: 'Package not found' });
    }
    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: { name: pkg.name },
                    unit_amount: Math.round(pkg.sale_price * 100),
                },
                quantity: 1,
            },
        ],
        metadata: {
            packageId,
            name,
            surname,
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/checkout/cancel`,
    });
    res.json({ url: session.url });
};
exports.createCheckoutSession = createCheckoutSession;
//# sourceMappingURL=stripeController.js.map