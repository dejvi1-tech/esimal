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

    // Validate required fields (server-side pricing ignores client amount/currency)
    if (!email) {
      throw new ValidationError('Email is required');
    }
    if (!packageId) {
      throw new ValidationError('Package ID is required');
    }

    logger.info(`Creating payment intent for package ${packageId}, email: ${email}`);

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
        throw new NotFoundError('Package not found');
      }

      packageData = packageBySlug;
      logger.info(`Package found by slug: ${packageId} -> UUID: ${packageData.id}`);
    } else {
      logger.info(`Package found by UUID: ${packageId}`);
    }

    // Use the actual UUID from the package data
    const actualPackageId = packageData.id;

    // Determine canonical amount and currency (server-side pricing)
    const DEFAULT_CURRENCY = (process.env.DEFAULT_CURRENCY || 'eur').toLowerCase();
    const useServerPricing = (process.env.ENFORCE_SERVER_PRICE || 'true').toLowerCase() !== 'false';
    const expectedAmount = Number(packageData.sale_price);
    const expectedCurrency = (packageData.currency || DEFAULT_CURRENCY).toLowerCase();
    const canonicalAmount = useServerPricing ? expectedAmount : (Number(amount) || expectedAmount);
    const canonicalCurrency = useServerPricing ? expectedCurrency : ((currency || expectedCurrency).toLowerCase());

    logger.info(
      `Using ${useServerPricing ? 'server-side' : 'client-provided'} pricing for package ${actualPackageId}: ${canonicalAmount} ${canonicalCurrency}`
    );

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
            packageId: actualPackageId,
          },
        });
        logger.info(`Created new customer: ${customer.id} for email: ${email}`);
      }
    } catch (customerError) {
      logger.error('Error creating/retrieving customer:', customerError);
      throw new PaymentError('Failed to create customer');
    }

    // Prepare idempotency key (prefer header, then body; otherwise generate unique to avoid reusing stale PIs)
    const headerIdem = (req.headers['x-idempotency-key'] as string) || '';
    const bodyIdem = typeof req.body?.idempotencyKey === 'string' ? req.body.idempotencyKey : '';
    const idempotencyKey = headerIdem || bodyIdem || `${Date.now()}:${Math.random().toString(36).slice(2)}`;

    // Create payment intent (amount/currency derived server-side)
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(canonicalAmount * 100), // Convert to cents
        currency: canonicalCurrency,
        customer: customer.id,
        metadata: {
          email: email,
          packageId: actualPackageId,
          packageSlug: packageId,
          packageName: packageData.name,
          packageDataAmount: packageData.data_amount?.toString?.() || String(packageData.data_amount),
          packageDays: packageData.days?.toString?.() || String(packageData.days),
          name: name || '',
          surname: surname || '',
          phone: phone || '',
          country: country || '',
          expectedAmountCents: Math.round(canonicalAmount * 100).toString(),
          expectedCurrency: canonicalCurrency,
          priceSource: useServerPricing ? 'server' : 'client',
          orderIdempotencyKey: idempotencyKey,
        },
        description: `eSIM Package: ${packageData.name} - ${packageData.data_amount}GB for ${packageData.days} days`,
        automatic_payment_methods: {
          enabled: true,
        },
      },
      { idempotencyKey }
    );

    logger.info(`Payment intent created successfully: ${paymentIntent.id} for customer: ${customer.id}`);

    // Create order in database (no metadata column dependency)
    const orderData = {
      package_id: actualPackageId,
      guest_email: email,
      amount: canonicalAmount,
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