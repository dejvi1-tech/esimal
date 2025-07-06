import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../utils/asyncHandler';
import axios from 'axios';
import { RoamifyService } from '../services/roamifyService';

// At top of file
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

// Mock function to get usage data from eSIM provider
// TODO: Replace with actual API integration
const getEsimProviderUsageData = async (iccid: string) => {
  // This is a mock implementation
  return {
    totalData: 1,
    usedData: 0.5,
    remainingData: 0.5,
    lastSyncDate: new Date().toISOString(),
    dataUsageHistory: [
      {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        usedData: 0.2
      },
      {
        date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        usedData: 0.3
      }
    ]
  };
};

// Admin-only function to get all eSIMs
export const getAllEsims = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { data: esims, error } = await supabase
    .from('esims')
    .select(`
      *,
              user:users(email, "firstName", "lastName"),
      order:orders (
        id,
        status,
        package:packages (
          id,
          name,
          data_amount,
          days,
          country,
          operator
        ),
        activation_date,
        expiry_date
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return next(new AppError('Error fetching eSIMs', 500));
  }

  res.status(200).json({
    status: 'success',
    data: esims,
  });
});

// Admin-only function to get eSIM by ICCID
export const getEsimByIccid = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { iccid } = req.params;

  if (!iccid || typeof iccid !== 'string') {
    return next(new AppError('ICCID is required', 400));
  }

  // Validate ICCID format (19-20 digits)
  if (!/^\d{19,20}$/.test(iccid)) {
    return next(new AppError('Invalid ICCID format. ICCID must be 19-20 digits.', 400));
  }

  // Get eSIM details from database
  const { data: esim, error: esimError } = await supabase
    .from('esims')
    .select(`
      id,
      iccid,
      status,
      user_id,
      order:orders (
        id,
        status,
        package:packages (
          id,
          name,
          data_amount,
          days,
          country,
          operator
        ),
        activation_date,
        expiry_date
      )
    `)
    .eq('iccid', iccid)
    .single();

  if (esimError || !esim) {
    return next(new AppError('eSIM not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: esim,
  });
});

// Admin-only function to get eSIM usage details
export const getEsimUsageDetails = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { iccid } = req.params;

  if (!iccid || typeof iccid !== 'string') {
    return next(new AppError('ICCID is required', 400));
  }

  // Validate ICCID format (19-20 digits)
  if (!/^\d{19,20}$/.test(iccid)) {
    return next(new AppError('Invalid ICCID format. ICCID must be 19-20 digits.', 400));
  }

  // Get eSIM details from database
  const { data: esim, error: esimError } = await supabase
    .from('esims')
    .select(`
      id,
      iccid,
      status,
      user_id,
      order:orders (
        id,
        status,
        package:packages (
          id,
          name,
          data_amount,
          days,
          country,
          operator
        ),
        activation_date,
        expiry_date
      )
    `)
    .eq('iccid', iccid)
    .single();

  if (esimError || !esim) {
    return next(new AppError('eSIM not found', 404));
  }

  // Get usage data from provider
  const usageData = await getEsimProviderUsageData(iccid);

  // Transform response to match API specification
  const response = {
    status: 'success',
    data: {
      iccid: esim.iccid,
      status: esim.status,
      order: esim.order,
      usage: usageData,
      network: {
        currentOperator: 'Unknown', // TODO: Get from provider
        signalStrength: 'Good', // TODO: Get from provider
        connectionType: '4G', // TODO: Get from provider
        lastConnectionDate: new Date().toISOString() // TODO: Get from provider
      }
    }
  };

  res.status(200).json(response);
});

// Admin-only function to update eSIM status
export const updateEsimStatus = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { iccid } = req.params;
  const { status } = req.body;

  if (!iccid || typeof iccid !== 'string') {
    return next(new AppError('ICCID is required', 400));
  }

  if (!status) {
    return next(new AppError('Status is required', 400));
  }

  // Validate ICCID format (19-20 digits)
  if (!/^\d{19,20}$/.test(iccid)) {
    return next(new AppError('Invalid ICCID format. ICCID must be 19-20 digits.', 400));
  }

  // Update eSIM status
  const { data: esim, error } = await supabase
    .from('esims')
    .update({ status })
    .eq('iccid', iccid)
    .select()
    .single();

  if (error) {
    return next(new AppError('Error updating eSIM status', 500));
  }

  if (!esim) {
    return next(new AppError('eSIM not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: esim,
  });
});

// Admin-only function to get eSIM usage statistics
export const getEsimUsageStats = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { data: stats, error } = await supabase
    .from('esims')
    .select('status')
    .then(result => {
      if (result.error) return result;
      
      const statusCounts = result.data?.reduce((acc, esim) => {
        acc[esim.status] = (acc[esim.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return { data: statusCounts, error: null };
    });

  if (error) {
    return next(new AppError('Error fetching eSIM statistics', 500));
  }

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

// Admin-only function to get eSIMs by user ID
export const getEsimsByUserId = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;

  const { data: esims, error } = await supabase
    .from('esims')
    .select(`
      *,
      order:orders (
        id,
        status,
        package:packages (
          id,
          name,
          data_amount,
          days,
          country,
          operator
        ),
        activation_date,
        expiry_date
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return next(new AppError('Error fetching eSIMs', 500));
  }

  res.status(200).json({
    status: 'success',
    data: esims,
  });
});

/**
 * Get account balance from Roamify API
 */
export const getAccountBalanceFromRoamify = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roamifyUrl = `${ROAMIFY_API_BASE}/api/balance`;
    const roamifyApiKey = process.env.ROAMIFY_API_KEY;

    if (!roamifyApiKey) {
      return next(new AppError('Roamify API key not configured', 500));
    }

    const response = await axios.get(
      roamifyUrl,
      {
        headers: {
          'Authorization': `Bearer ${roamifyApiKey}`,
          'User-Agent': 'esim-marketplace/1.0'
        }
      }
    );

    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      // Forward error from Roamify
      return res.status(error.response.status).json(error.response.data);
    }
    next(new AppError('Failed to get account balance from Roamify', 500));
  }
});

/**
 * Get eSIM usage by ICCID for balance check
 */
export const getEsimUsageByIccid = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { iccid } = req.params;

  console.log(`[DEBUG] getEsimUsageByIccid called with ICCID: ${iccid}`);

  if (!iccid) {
    console.log(`[DEBUG] No ICCID provided`);
    return next(new AppError('ICCID is required', 400));
  }

  // Validate ICCID format (19-20 digits)
  if (!/^\d{19,20}$/.test(iccid)) {
    console.log(`[DEBUG] Invalid ICCID format: ${iccid}`);
    return next(new AppError('Invalid ICCID format. ICCID must be 19-20 digits.', 400));
  }

  try {
    console.log(`[DEBUG] Fetching order details for ICCID: ${iccid}`);
    
    // Get order details from database first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, data_amount, days, status, created_at, expiry_date, package_id')
      .eq('iccid', iccid)
      .single();

    console.log(`[DEBUG] Order query result:`, { order, orderError });

    if (orderError && orderError.code !== 'PGRST116') {
      console.error(`[DEBUG] Database error:`, orderError);
      return next(new AppError(`Error fetching order details: ${orderError.message}`, 500));
    }

    if (!order) {
      console.log(`[DEBUG] No order found for ICCID: ${iccid}`);
      return next(new AppError('eSIM not found with this ICCID', 404));
    }

    console.log(`[DEBUG] Order found:`, order);

    let usage = null;
    let usageError = null;

    // Try to get usage details from Roamify
    try {
      usage = await RoamifyService.getEsimUsageDetails(iccid);
    } catch (error: any) {
      usageError = error;
      console.warn(`Failed to get usage from Roamify for ICCID ${iccid}:`, error.message);
      
      // Fallback: Provide mock usage data based on order
      usage = {
        dataUsed: 0, // Mock: No data used yet
        dataLimit: order.data_amount || 1,
        dataRemaining: order.data_amount || 1,
        status: order.status === 'completed' ? 'active' : 'inactive',
        lastUpdated: new Date().toISOString()
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        iccid,
        dataUsed: usage.dataUsed,
        dataLimit: usage.dataLimit || order.data_amount,
        dataRemaining: usage.dataRemaining,
        status: usage.status,
        expiry: order.expiry_date,
        createdAt: order.created_at,
        orderId: order.id,
        dataSource: usageError ? 'fallback' : 'roamify',
        lastUpdated: usage.lastUpdated,
      },
    });
  } catch (error: any) {
    console.error('Error in getEsimUsageByIccid:', error);
    
    // Ensure we always return JSON, never HTML
    if (error.response && error.response.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
      return next(new AppError('External API returned invalid response', 502));
    }
    
    next(new AppError('Failed to get eSIM usage details', 500));
  }
}); 