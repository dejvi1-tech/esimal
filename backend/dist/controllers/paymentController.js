"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = void 0;
const stripe_1 = __importDefault(require("stripe"));
const supabase_1 = require("../config/supabase");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-05-28.basil'
});
/**
 * Create a payment intent for Stripe Elements
 */
const createPaymentIntent = async (req, res, next) => {
    try {
        const { amount, currency, email, packageId, name, surname, phone, country } = req.body;
        // Validate required fields
        if (!amount || amount <= 0) {
            throw new errors_1.ValidationError('Valid amount is required');
        }
        if (!currency) {
            throw new errors_1.ValidationError('Currency is required');
        }
        if (!email) {
            throw new errors_1.ValidationError('Email is required');
        }
        if (!packageId) {
            throw new errors_1.ValidationError('Package ID is required');
        }
        logger_1.logger.info(`Creating payment intent for package ${packageId}, amount: ${amount} ${currency}, email: ${email}`);
        // Get package details by id (slug)
        const { data: packageData, error: packageError } = await supabase_1.supabase
            .from('my_packages')
            .select('*')
            .eq('id', packageId) // packageId is the slug
            .single();
        if (packageError || !packageData) {
            logger_1.logger.error(`Package not found: ${packageId}`, packageError);
            throw new errors_1.NotFoundError('Package not found');
        }
        // Use the actual UUID from the package data
        const actualPackageId = packageData.id;
        // Create or retrieve Stripe customer
        let customer;
        try {
            const existingCustomers = await stripe.customers.list({
                email: email,
                limit: 1,
            });
            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
                logger_1.logger.info(`Found existing customer: ${customer.id} for email: ${email}`);
            }
            else {
                customer = await stripe.customers.create({
                    email: email,
                    metadata: {
                        packageId: actualPackageId,
                    },
                });
                logger_1.logger.info(`Created new customer: ${customer.id} for email: ${email}`);
            }
        }
        catch (customerError) {
            logger_1.logger.error('Error creating/retrieving customer:', customerError);
            throw new errors_1.PaymentError('Failed to create customer');
        }
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            customer: customer.id,
            metadata: {
                email: email,
                packageId: actualPackageId,
                packageSlug: packageId,
                packageName: packageData.name,
                packageDataAmount: packageData.data_amount.toString(),
                packageValidityDays: packageData.validity_days.toString(),
                name: name || '',
                surname: surname || '',
                phone: phone || '',
                country: country || '',
            },
            description: `eSIM Package: ${packageData.name} - ${packageData.data_amount}GB for ${packageData.validity_days} days`,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        logger_1.logger.info(`Payment intent created successfully: ${paymentIntent.id} for customer: ${customer.id}`);
        // Create order in database
        const orderData = {
            package_id: actualPackageId,
            guest_email: email,
            amount: amount,
            status: 'pending',
            payment_intent_id: paymentIntent.id,
            created_at: new Date().toISOString(),
        };
        const { data: order, error: orderError } = await supabase_1.supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        if (orderError) {
            logger_1.logger.error('Error creating order:', orderError);
            // Don't fail the payment intent creation, but log the error
            logger_1.logger.warn('Payment intent created but order creation failed', {
                paymentIntentId: paymentIntent.id,
                error: orderError.message
            });
        }
        else {
            logger_1.logger.info(`Order created successfully: ${order.id} for payment intent: ${paymentIntent.id}`);
        }
        res.status(200).json({
            status: 'success',
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                customerId: customer.id,
                orderId: order?.id,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating payment intent:', error);
        next(error);
    }
};
exports.createPaymentIntent = createPaymentIntent;
//# sourceMappingURL=paymentController.js.map