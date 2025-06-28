import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import {
  ValidationError,
  NotFoundError,
} from '../utils/errors';

/**
 * Debug order audit record
 */
export const debugOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }

    // Get order with all audit information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        my_packages (
          id,
          name,
          data_amount,
          validity_days,
          country_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new NotFoundError('Order not found');
    }

    // Get package details
    const packageData = order.my_packages;

    // Format the audit record
    const auditRecord = {
      orderId: order.id,
      paymentIntentId: order.stripe_payment_intent_id,
      customerEmail: order.user_email,
      customerName: order.user_name,
      packageId: order.packageId,
      packageName: packageData?.name,
      amount: order.amount,
      currency: order.currency || 'EUR',
      status: order.status,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      
      // Email delivery status
      emailSent: order.email_sent,
      emailSentAt: order.email_sent_at,
      emailError: order.email_error,
      
      // eSIM delivery status
      esimDelivered: order.esim_delivered,
      esimDeliveredAt: order.esim_delivered_at,
      esimError: order.esim_error,
      esimCode: order.esim_code,
      qrCodeData: order.qr_code_data ? 'Present' : 'Not generated',
      
      // Detailed audit log
      auditLog: order.audit_log || {},
      
      // Timeline
      timeline: [
        {
          event: 'Order Created',
          timestamp: order.created_at,
          status: 'completed'
        },
        {
          event: 'Payment Processed',
          timestamp: order.paid_at,
          status: order.paid_at ? 'completed' : 'pending',
          details: order.stripe_payment_intent_id ? `Payment Intent: ${order.stripe_payment_intent_id}` : 'No payment intent'
        },
        {
          event: 'Email Sent',
          timestamp: order.email_sent_at,
          status: order.email_sent ? 'completed' : (order.email_error ? 'failed' : 'pending'),
          details: order.email_error || 'Email sent successfully'
        },
        {
          event: 'eSIM Delivered',
          timestamp: order.esim_delivered_at,
          status: order.esim_delivered ? 'completed' : (order.esim_error ? 'failed' : 'pending'),
          details: order.esim_error || `eSIM Code: ${order.esim_code}`
        }
      ].filter(item => item.timestamp || item.status !== 'pending')
    };

    logger.info(`Debug order request: ${orderId}`, {
      orderId,
      paymentIntentId: order.stripe_payment_intent_id,
      emailSent: order.email_sent,
      esimDelivered: order.esim_delivered,
    });

    res.status(200).json({
      status: 'success',
      data: auditRecord,
    });
  } catch (error) {
    logger.error('Error debugging order:', error);
    next(error);
  }
}; 