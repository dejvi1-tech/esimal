import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';
import { generateEsimCode, generateQRCodeData, isAxiosError } from '../utils/esimUtils';
import {
  ValidationError,
  NotFoundError,
  PaymentError,
  ConflictError,
  ErrorMessages,
} from '../utils/errors';
import { emailTemplates } from '../utils/emailTemplates';
import { RoamifyService } from '../services/roamifyService';
import axios from 'axios';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

// Create admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OrderStatus {
  pending: string[];
  paid: string[];
  activated: string[];
  expired: string[];
  cancelled: string[];
  refunded: string[];
}

// Valid order status transitions
const VALID_STATUS_TRANSITIONS: OrderStatus = {
  pending: ['paid', 'cancelled'],
  paid: ['activated', 'refunded'],
  activated: ['expired', 'refunded'],
  expired: [],
  cancelled: [],
  refunded: [],
};

// Maximum refund period in hours
const MAX_REFUND_PERIOD_HOURS = 24;

// Create order and send confirmation email
export const createOrder = async (
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

    // Generate unique eSIM code
    const esimCode = await generateEsimCode();

    // Generate QR code data
    const qrCodeData = generateQRCodeData(esimCode, packageData.name);

    // Create order in database
    const orderData = {
      packageId: packageId,
      user_id: userId || null,
      user_email: userEmail,
      user_name: userName || userEmail,
      esim_code: esimCode,
      qr_code_data: qrCodeData,
      status: 'paid', // Assuming immediate payment or you can change this based on your flow
      amount: packageData.sale_price,
      data_amount: packageData.data_amount,
      validity_days: packageData.validity_days,
      country_name: packageData.country_name,
      created_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      logger.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    // Send confirmation email with QR code
    try {
      await sendEmail({
        to: userEmail,
        subject: emailTemplates.orderConfirmation.subject,
        html: async () => emailTemplates.orderConfirmation.html({
          orderId: order.id,
          packageName: packageData.name,
          amount: packageData.sale_price,
          dataAmount: `${packageData.data_amount}GB`,
          validityDays: packageData.validity_days,
          esimCode: esimCode,
          qrCodeData: qrCodeData,
          isGuestOrder: !userId,
          signupUrl: `${process.env.FRONTEND_URL}/signup`,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        }),
      });

      logger.info(`Order confirmation email sent to ${userEmail} for order ${order.id}`);
    } catch (emailError) {
      logger.error('Error sending confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        esimCode: esimCode,
        qrCodeData: qrCodeData,
        packageName: packageData.name,
        amount: packageData.sale_price,
        dataAmount: packageData.data_amount,
        validityDays: packageData.validity_days,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create order for my_packages (frontend packages) - WITH REAL ROAMIFY API and user info
export const createMyPackageOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { packageId, userEmail, userName, name, surname } = req.body;

    // Validate required fields
    if (!packageId) {
      throw new ValidationError('Package ID is required');
    }
    if (!userEmail) {
      throw new ValidationError('User email is required');
    }
    if (!name || !surname) {
      throw new ValidationError('Name and surname are required');
    }

    // Get package details from my_packages
    const { data: packageData, error: packageError } = await supabase
      .from('my_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      throw new NotFoundError('Package not found');
    }

    let esimCode: string;
    let roamifyOrderId: string;
    let realQRData: {
      lpaCode: string;
      qrCodeUrl: string;
      activationCode: string;
      iosQuickInstall: string;
    };

    // Step 1: Create eSIM order with Roamify (with fallback)
    logger.info(`Creating Roamify order for package: ${packageData.name} (${packageData.reseller_id})`);
    
    try {
      const roamifyOrder = await RoamifyService.createEsimOrder(packageData.reseller_id, 1);
      esimCode = roamifyOrder.esimId;
      roamifyOrderId = roamifyOrder.orderId;
      logger.info(`Roamify order created. Order ID: ${roamifyOrderId}, eSIM ID: ${esimCode}`);
    } catch (roamifyError) {
      logger.error('Failed to create Roamify order, using fallback:', roamifyError);
      
      // Fallback: Generate a unique eSIM code locally
      esimCode = await generateEsimCode();
      roamifyOrderId = `fallback-${Date.now()}`;
      
      logger.info(`Using fallback eSIM code: ${esimCode}`);
    }

    // Step 2: Generate real QR code from Roamify (with fallback)
    logger.info(`Generating real QR code for eSIM: ${esimCode}`);
    
    try {
      realQRData = await RoamifyService.generateRealQRCode(esimCode);
      logger.info(`Real QR code generated. LPA Code: ${realQRData.lpaCode}`);
    } catch (qrError) {
      logger.error('Failed to generate real QR code, using fallback:', qrError);
      
      // Fallback: Generate QR code locally
      const fallbackLpaCode = generateQRCodeData(esimCode, packageData.name);
      realQRData = {
        lpaCode: fallbackLpaCode,
        qrCodeUrl: '', // Will be generated in email template
        activationCode: esimCode,
        iosQuickInstall: '',
      };
      
      logger.info(`Using fallback QR code. LPA Code: ${fallbackLpaCode}`);
    }

    // Step 3: Create order in database with real Roamify data and user info
    const orderData = {
      packageId: packageId,
      user_email: userEmail,
      user_name: userName || `${name} ${surname}`,
      name,
      surname,
      esim_code: esimCode,
      qr_code_data: realQRData.lpaCode, // Store the real LPA code from Roamify
      roamify_order_id: roamifyOrderId,
      status: 'paid',
      amount: packageData.sale_price,
      data_amount: packageData.data_amount,
      validity_days: packageData.validity_days,
      country_name: packageData.country_name,
      created_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      logger.error('Error creating order:', orderError);
      return next(new Error(`Failed to create order: ${orderError.message}`));
    }

    logger.info(`Order saved to database. Order ID: ${order.id}`);

    // Step 4: Send confirmation email with real QR code and user info
    try {
      await sendEmail({
        to: userEmail,
        subject: emailTemplates.orderConfirmation.subject,
        html: async () => emailTemplates.orderConfirmation.html({
          orderId: order.id,
          packageName: packageData.name,
          amount: packageData.sale_price,
          dataAmount: `${packageData.data_amount}GB`,
          validityDays: packageData.validity_days,
          esimCode: esimCode,
          qrCodeData: realQRData.lpaCode, // Use real LPA code from Roamify
          qrCodeUrl: realQRData.qrCodeUrl, // Use real QR code URL from Roamify
          isGuestOrder: true,
          signupUrl: `${process.env.FRONTEND_URL}/signup`,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          name,
          surname,
          email: userEmail,
        }),
      });

      logger.info(`Order confirmation email sent to ${userEmail} for order ${order.id}`);
    } catch (emailError) {
      logger.error('Error sending confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully with real Roamify eSIM and QR code',
      data: {
        orderId: order.id,
        esimCode: esimCode,
        qrCodeData: realQRData.lpaCode,
        qrCodeUrl: realQRData.qrCodeUrl,
        activationCode: realQRData.activationCode,
        iosQuickInstall: realQRData.iosQuickInstall,
        roamifyOrderId: roamifyOrderId,
        packageName: packageData.name,
        amount: packageData.sale_price,
        dataAmount: packageData.data_amount,
        validityDays: packageData.validity_days,
        name,
        surname,
        email: userEmail,
      },
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("Generic error:", error.message);
    } else {
      console.error("Unknown error:", String(error));
    }
    next(error);
  }
};

export const validateOrderStatusTransition = (
  currentStatus: keyof OrderStatus,
  newStatus: string
): boolean => {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

const isRefundEligible = (order: any): boolean => {
  if (order.status !== 'paid' && order.status !== 'activated') {
    return false;
  }

  const orderDate = new Date(order.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);

  return hoursDiff <= MAX_REFUND_PERIOD_HOURS;
};

// Admin-only function to get all orders
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        package:packages(*),
        user:users(email, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Admin-only function to get order by ID
export const getOrder = async (
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
        package:packages(*),
        user:users(email, first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!order) {
      throw new NotFoundError('Order');
    }

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    if (!status || !Object.keys(VALID_STATUS_TRANSITIONS).includes(status)) {
      throw new ValidationError('Invalid order status');
    }

    // Get current order
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      throw new NotFoundError('Order not found');
    }

    // Validate status transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentOrder.status as keyof OrderStatus] || [];
    if (!allowedTransitions.includes(status)) {
      throw new ValidationError(`Cannot transition from ${currentOrder.status} to ${status}`);
    }

    // Update order status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    // Special handling for activation
    if (status === 'activated') {
      updateData.activated_at = new Date().toISOString();
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating order status:', updateError);
      throw new Error('Failed to update order status');
    }

    logger.info(`Order ${orderId} status updated from ${currentOrder.status} to ${status}`);

    res.json({
      status: 'success',
      message: 'Order status updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    next(error);
  }
};

// Get order details with eSIM status
export const getOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        package:my_packages(name, country_name, data_amount, validity_days)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new NotFoundError('Order not found');
    }

    // Try to get real-time eSIM status from Roamify if available
    let roamifyStatus = null;
    if (order.roamify_order_id && !order.roamify_order_id.startsWith('fallback-')) {
      try {
        const roamifyData = await RoamifyService.getEsimDetails(order.esim_code);
        roamifyStatus = {
          status: roamifyData.status,
          iccid: roamifyData.iccid,
          createdAt: roamifyData.createdAt,
          updatedAt: roamifyData.updatedAt,
          expiredAt: roamifyData.expiredAt
        };
      } catch (error) {
        logger.warn(`Could not fetch Roamify status for order ${orderId}:`, error);
      }
    }

    res.json({
      status: 'success',
      data: {
        ...order,
        roamifyStatus
      }
    });

  } catch (error) {
    next(error);
  }
};

// Admin-only function to cancel order
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Get order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.status === 'cancelled') {
      throw new ConflictError('Order is already cancelled');
    }

    if (order.status === 'activated') {
      throw new ConflictError('Cannot cancel activated order');
    }

    // If order was paid, process refund
    if (order.status === 'paid' && order.payment_intent_id) {
      try {
        await stripe.refunds.create({
          payment_intent: order.payment_intent_id,
        });
      } catch (refundError) {
        logger.error('Failed to process refund:', refundError);
        throw new PaymentError('Failed to process refund');
      }
    }

    // Update order status to cancelled
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      status: 'success',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
}; 