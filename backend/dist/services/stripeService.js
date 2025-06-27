"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const supabase_1 = require("../config/supabase");
const logger_1 = require("../utils/logger");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-05-28.basil',
});
class StripeService {
    /**
     * Create a payment intent for processing payments
     */
    static async createPaymentIntent(data) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(data.amount * 100), // Convert to cents
                currency: data.currency || 'usd',
                customer: data.customerId,
                metadata: data.metadata,
                description: data.description,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            logger_1.logger.info(`Payment intent created: ${paymentIntent.id}`);
            return paymentIntent;
        }
        catch (error) {
            logger_1.logger.error('Error creating payment intent:', error);
            throw error;
        }
    }
    /**
     * Create or retrieve a Stripe customer
     */
    static async createOrRetrieveCustomer(data) {
        try {
            // First, check if customer already exists in our database
            const { data: existingUser } = await supabase_1.supabase
                .from('users')
                .select('stripe_customer_id')
                .eq('email', data.email)
                .single();
            // If customer exists in Stripe, retrieve it
            if (existingUser?.stripe_customer_id) {
                try {
                    const customer = await stripe.customers.retrieve(existingUser.stripe_customer_id);
                    if (customer && !customer.deleted) {
                        return customer;
                    }
                }
                catch (error) {
                    logger_1.logger.warn(`Stripe customer not found: ${existingUser.stripe_customer_id}`);
                }
            }
            // Create new customer
            const customer = await stripe.customers.create({
                email: data.email,
                name: data.name,
                phone: data.phone,
                metadata: data.metadata,
            });
            // Update user record with Stripe customer ID
            await supabase_1.supabase
                .from('users')
                .update({ stripe_customer_id: customer.id })
                .eq('email', data.email);
            logger_1.logger.info(`Stripe customer created: ${customer.id}`);
            return customer;
        }
        catch (error) {
            logger_1.logger.error('Error creating/retrieving customer:', error);
            throw error;
        }
    }
    /**
     * Retrieve a payment intent
     */
    static async retrievePaymentIntent(paymentIntentId) {
        try {
            return await stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            logger_1.logger.error('Error retrieving payment intent:', error);
            throw error;
        }
    }
    /**
     * Confirm a payment intent
     */
    static async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
        try {
            return await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
            });
        }
        catch (error) {
            logger_1.logger.error('Error confirming payment intent:', error);
            throw error;
        }
    }
    /**
     * Create a refund
     */
    static async createRefund(paymentIntentId, amount, reason) {
        try {
            const refundData = {
                payment_intent: paymentIntentId,
            };
            if (amount) {
                refundData.amount = Math.round(amount * 100); // Convert to cents
            }
            if (reason) {
                refundData.reason = reason;
            }
            const refund = await stripe.refunds.create(refundData);
            logger_1.logger.info(`Refund created: ${refund.id}`);
            return refund;
        }
        catch (error) {
            logger_1.logger.error('Error creating refund:', error);
            throw error;
        }
    }
    /**
     * Get customer's payment methods
     */
    static async getCustomerPaymentMethods(customerId) {
        try {
            const paymentMethods = await stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });
            return paymentMethods.data;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving customer payment methods:', error);
            throw error;
        }
    }
    /**
     * Attach payment method to customer
     */
    static async attachPaymentMethod(paymentMethodId, customerId) {
        try {
            return await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });
        }
        catch (error) {
            logger_1.logger.error('Error attaching payment method:', error);
            throw error;
        }
    }
    /**
     * Detach payment method from customer
     */
    static async detachPaymentMethod(paymentMethodId) {
        try {
            return await stripe.paymentMethods.detach(paymentMethodId);
        }
        catch (error) {
            logger_1.logger.error('Error detaching payment method:', error);
            throw error;
        }
    }
    /**
     * Verify webhook signature
     */
    static constructWebhookEvent(payload, signature, secret) {
        try {
            return stripe.webhooks.constructEvent(payload, signature, secret);
        }
        catch (error) {
            logger_1.logger.error('Webhook signature verification failed:', error);
            throw error;
        }
    }
    /**
     * Get customer by ID
     */
    static async getCustomer(customerId) {
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer.deleted) {
                throw new Error('Customer has been deleted');
            }
            return customer;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving customer:', error);
            throw error;
        }
    }
    /**
     * Update customer
     */
    static async updateCustomer(customerId, data) {
        try {
            return await stripe.customers.update(customerId, data);
        }
        catch (error) {
            logger_1.logger.error('Error updating customer:', error);
            throw error;
        }
    }
    /**
     * Delete customer
     */
    static async deleteCustomer(customerId) {
        try {
            return await stripe.customers.del(customerId);
        }
        catch (error) {
            logger_1.logger.error('Error deleting customer:', error);
            throw error;
        }
    }
}
exports.StripeService = StripeService;
exports.default = StripeService;
//# sourceMappingURL=stripeService.js.map