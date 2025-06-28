import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import {
  ValidationError,
  NotFoundError,
  PaymentError,
} from '../utils/errors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { 
  apiVersion: '2025-05-28.basil' 
});

/**
 * Create a payment intent for Stripe Elements
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, currency, email, packageId, name, surname, phone, country } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      throw new ValidationError('Valid amount is required');
    }
    if (!currency) {
      throw new ValidationError('Currency is required');
    }
    if (!email) {
      throw new ValidationError('Email is required');
    }
    if (!packageId) {
      throw new ValidationError('Package ID is required');
    }

    logger.info(`Creating payment intent for package ${packageId}, amount: ${amount} ${currency}, email: ${email}`);

    // Get package details
    const { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      logger.error(`Package not found: ${packageId}`, packageError);
      throw new NotFoundError('Package not found');
    }

    // Create or retrieve Stripe customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        logger.info(`Found existing customer: ${customer.id} for email: ${email}`);
      } else {
        customer = await stripe.customers.create({
          email: email,
          metadata: {
            packageId: packageId,
          },
        });
        logger.info(`Created new customer: ${customer.id} for email: ${email}`);
      }
    } catch (customerError) {
      logger.error('Error creating/retrieving customer:', customerError);
      throw new PaymentError('Failed to create customer');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customer.id,
      metadata: {
        email: email,
        packageId: packageId,
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

    logger.info(`Payment intent created successfully: ${paymentIntent.id} for customer: ${customer.id}`);

    // Create order in database
    const orderData = {
      package_id: packageId,
      guest_email: email,
      amount: amount,
      status: 'pending',
      payment_intent_id: paymentIntent.id,
      created_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      logger.error('Error creating order:', orderError);
      // Don't fail the payment intent creation, but log the error
      logger.warn('Payment intent created but order creation failed', { 
        paymentIntentId: paymentIntent.id, 
        error: orderError.message 
      });
    } else {
      logger.info(`Order created successfully: ${order.id} for payment intent: ${paymentIntent.id}`);
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
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    next(error);
  }
}; 