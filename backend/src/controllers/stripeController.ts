import { Request, Response, NextFunction } from 'express';
import StripeService, { PaymentIntentData, CustomerData } from '../services/stripeService';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import {
  ValidationError,
  NotFoundError,
  PaymentError,
  ErrorMessages,
} from '../utils/errors';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-05-28.basil' });

/**
 * Create a payment intent for a package purchase
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { packageId, userEmail, userName, userId } = req.body;

    // Validate required fields
    if (!packageId) {
      throw new ValidationError('Package ID is required');
    }
    if (!userEmail) {
      throw new ValidationError('User email is required');
    }

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      throw new NotFoundError('Package not found');
    }

    // Create or retrieve Stripe customer
    const customerData: CustomerData = {
      email: userEmail,
      name: userName,
      metadata: {
        userId: userId || 'guest',
        packageId: packageId,
      },
    };

    const customer = await StripeService.createOrRetrieveCustomer(customerData);

    // Create payment intent
    const paymentIntentData: PaymentIntentData = {
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

    const paymentIntent = await StripeService.createPaymentIntent(paymentIntentData);

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
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm a payment intent
 */
export const confirmPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId) {
      throw new ValidationError('Payment intent ID is required');
    }
    if (!paymentMethodId) {
      throw new ValidationError('Payment method ID is required');
    }

    const paymentIntent = await StripeService.confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId
    );

    if (paymentIntent.status === 'succeeded') {
      // Payment successful - create order
      const metadata = paymentIntent.metadata;
      const packageId = metadata.packageId;
      const userEmail = metadata.userEmail;
      const userId = metadata.userId;

      // Get package details
      const { data: packageData } = await supabase
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
          stripe_customer_id: paymentIntent.customer as string,
          created_at: new Date().toISOString(),
        };

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) {
          logger.error('Error creating order after payment:', orderError);
        } else {
          logger.info(`Order created successfully: ${order.id}`);
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
    } else {
      throw new PaymentError('Payment confirmation failed');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment intent status
 */
export const getPaymentIntentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      throw new ValidationError('Payment intent ID is required');
    }

    const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId);

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
  } catch (error) {
    next(error);
  }
};

/**
 * Create a refund
 */
export const createRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      throw new ValidationError('Payment intent ID is required');
    }

    const refund = await StripeService.createRefund(
      paymentIntentId,
      amount,
      reason
    );

    // Update order status to refunded
    await supabase
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer payment methods
 */
export const getCustomerPaymentMethods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const paymentMethods = await StripeService.getCustomerPaymentMethods(customerId);

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
  } catch (error) {
    next(error);
  }
};

/**
 * Attach payment method to customer
 */
export const attachPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentMethodId, customerId } = req.body;

    if (!paymentMethodId) {
      throw new ValidationError('Payment method ID is required');
    }
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const paymentMethod = await StripeService.attachPaymentMethod(
      paymentMethodId,
      customerId
    );

    res.status(200).json({
      status: 'success',
      message: 'Payment method attached successfully',
      data: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        customerId: paymentMethod.customer,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Detach payment method from customer
 */
export const detachPaymentMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { paymentMethodId } = req.params;

    if (!paymentMethodId) {
      throw new ValidationError('Payment method ID is required');
    }

    const paymentMethod = await StripeService.detachPaymentMethod(paymentMethodId);

    res.status(200).json({
      status: 'success',
      message: 'Payment method detached successfully',
      data: {
        id: paymentMethod.id,
        type: paymentMethod.type,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer details
 */
export const getCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const customer = await StripeService.getCustomer(customerId);

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
  } catch (error) {
    next(error);
  }
};

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
  const { packageId, email, name, surname } = req.body;

  // 1. Lookup package in Supabase
  const { data: pkg, error } = await supabase
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