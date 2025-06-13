import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';
import { generateSignupToken, verifySignupToken } from '../utils/tokenUtils';
import { User } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

interface UserWithStripe extends User {
  stripeCustomerId?: string;
}

interface GuestOrderData {
  email: string;
  firstName?: string;
  lastName?: string;
  packageId: string;
  paymentMethodId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserWithStripe;
    }
  }
}

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { packageId, paymentMethodId } = req.body;
    const user = req.user;

    if (!user?.email) {
      throw new AppError(401, 'User not authenticated');
    }

    // Get package details
    const { data: pkg, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !pkg) {
      throw new AppError(404, 'Package not found');
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        logger.error('Failed to update user with Stripe customer ID:', updateError);
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.price * 100, // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        packageId,
        userId: user.id,
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError(400, 'Payment failed');
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          package_id: packageId,
          amount: pkg.price,
          status: 'completed',
          payment_intent_id: paymentIntent.id,
          esim_code: generateEsimCode(),
        },
      ])
      .select()
      .single();

    if (orderError) {
      throw new AppError(400, orderError.message);
    }

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Order Confirmation - eSIM Marketplace',
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your purchase!</p>
        <p>Your eSIM code is: ${order.esim_code}</p>
        <p>Package: ${pkg.name}</p>
        <p>Amount: $${pkg.price}</p>
        <p>Data: ${pkg.data_amount}GB</p>
        <p>Duration: ${pkg.duration} days</p>
      `,
    });

    res.status(201).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        packages (*),
        users (email, first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new AppError(404, 'Order not found');
    }

    // Check if user is authorized to view this order
    if (order.user_id !== req.user?.id && req.user?.role !== 'admin') {
      throw new AppError(403, 'Not authorized to view this order');
    }

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        packages (*)
      `)
      .eq('user_id', req.user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(400, error.message);
    }

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      throw new AppError(404, 'Order not found');
    }

    // Check if user is authorized to cancel this order
    if (order.user_id !== req.user?.id && req.user?.role !== 'admin') {
      throw new AppError(403, 'Not authorized to cancel this order');
    }

    // Check if order can be cancelled
    if (order.status !== 'completed') {
      throw new AppError(400, 'Order cannot be cancelled');
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.payment_intent_id,
    });

    if (refund.status !== 'succeeded') {
      throw new AppError(400, 'Refund failed');
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        refund_id: refund.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new AppError(400, updateError.message);
    }

    // Send cancellation email
    await sendEmail({
      to: req.user?.email || '',
      subject: 'Order Cancelled - eSIM Marketplace',
      html: `
        <h1>Order Cancelled</h1>
        <p>Your order has been cancelled and refunded.</p>
        <p>Order ID: ${order.id}</p>
        <p>Refund Amount: $${order.amount}</p>
      `,
    });

    res.status(200).json({
      status: 'success',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const createGuestOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, firstName, lastName, packageId, paymentMethodId } = req.body as GuestOrderData;

    // Get package details
    const { data: pkg, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !pkg) {
      throw new AppError(404, 'Package not found');
    }

    // Create a temporary Stripe customer for the guest
    const customer = await stripe.customers.create({
      email,
      metadata: {
        isGuest: 'true',
        firstName: firstName || '',
        lastName: lastName || '',
      },
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.price * 100, // Convert to cents
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        packageId,
        isGuest: 'true',
        guestEmail: email,
      },
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError(400, 'Payment failed');
    }

    // Create guest order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          guest_email: email,
          guest_first_name: firstName,
          guest_last_name: lastName,
          package_id: packageId,
          amount: pkg.price,
          status: 'completed',
          payment_intent_id: paymentIntent.id,
          stripe_customer_id: customer.id,
          esim_code: generateEsimCode(),
          is_guest_order: true,
        },
      ])
      .select()
      .single();

    if (orderError) {
      throw new AppError(400, orderError.message);
    }

    // Send confirmation email with signup link
    const signupToken = generateSignupToken(email, order.id);
    await sendEmail({
      to: email,
      subject: 'Order Confirmation - eSIM Marketplace',
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your purchase!</p>
        <p>Your eSIM code is: ${order.esim_code}</p>
        <p>Package: ${pkg.name}</p>
        <p>Amount: $${pkg.price}</p>
        <p>Data: ${pkg.data_amount}GB</p>
        <p>Duration: ${pkg.duration} days</p>
        <p>Want to manage your eSIM and track your orders? <a href="${process.env.FRONTEND_URL}/signup?token=${signupToken}">Create an account</a></p>
      `,
    });

    res.status(201).json({
      status: 'success',
      data: {
        order,
        signupToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const convertGuestToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;
    const { email, orderId } = verifySignupToken(token);

    // Get the guest order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('guest_email', email)
      .single();

    if (orderError || !order) {
      throw new AppError(404, 'Order not found');
    }

    // Create new user account
    const { data: authData, error: userError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: order.guest_first_name,
          last_name: order.guest_last_name,
        },
      },
    });

    if (userError || !authData.user) {
      throw new AppError(400, userError?.message || 'Failed to create user account');
    }

    // Update order with user ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        user_id: authData.user.id,
        is_guest_order: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      throw new AppError(400, updateError.message);
    }

    // Update Stripe customer with user ID
    await stripe.customers.update(order.stripe_customer_id, {
      metadata: {
        userId: authData.user.id,
        isGuest: 'false',
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: authData.user,
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate eSIM code
const generateEsimCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 16;
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}; 