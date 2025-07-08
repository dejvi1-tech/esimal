"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEsimUsageByIccid = exports.getAccountBalanceFromRoamify = exports.getEsimsByUserId = exports.getEsimUsageStats = exports.updateEsimStatus = exports.getEsimUsageDetails = exports.getEsimByIccid = exports.getAllEsims = void 0;
const supabase_1 = require("../config/supabase");
const appError_1 = require("../utils/appError");
const asyncHandler_1 = require("../utils/asyncHandler");
const axios_1 = __importDefault(require("axios"));
const roamifyService_1 = require("../services/roamifyService");
// At top of file
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
// Mock function to get usage data from eSIM provider
// TODO: Replace with actual API integration
const getEsimProviderUsageData = async (iccid) => {
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
exports.getAllEsims = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { data: esims, error } = await supabase_1.supabase
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
        activation_date
      )
    `)
        .order('created_at', { ascending: false });
    if (error) {
        return next(new appError_1.AppError('Error fetching eSIMs', 500));
    }
    res.status(200).json({
        status: 'success',
        data: esims,
    });
});
// Admin-only function to get eSIM by ICCID
exports.getEsimByIccid = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { iccid } = req.params;
    if (!iccid || typeof iccid !== 'string') {
        return next(new appError_1.AppError('ICCID is required', 400));
    }
    // Validate ICCID format (19-20 digits)
    if (!/^\d{19,20}$/.test(iccid)) {
        return next(new appError_1.AppError('Invalid ICCID format. ICCID must be 19-20 digits.', 400));
    }
    // Get eSIM details from database
    const { data: esim, error: esimError } = await supabase_1.supabase
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
          validity_days,
          country,
          operator
        ),
        activation_date
      )
    `)
        .eq('iccid', iccid)
        .single();
    if (esimError || !esim) {
        return next(new appError_1.AppError('eSIM not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: esim,
    });
});
// Admin-only function to get eSIM usage details
exports.getEsimUsageDetails = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { iccid } = req.params;
    if (!iccid || typeof iccid !== 'string') {
        return next(new appError_1.AppError('ICCID is required', 400));
    }
    // Validate ICCID format (19-20 digits)
    if (!/^\d{19,20}$/.test(iccid)) {
        return next(new appError_1.AppError('Invalid ICCID format. ICCID must be 19-20 digits.', 400));
    }
    // Get eSIM details from database
    const { data: esim, error: esimError } = await supabase_1.supabase
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
          validity_days,
          country,
          operator
        ),
        activation_date
      )
    `)
        .eq('iccid', iccid)
        .single();
    if (esimError || !esim) {
        return next(new appError_1.AppError('eSIM not found', 404));
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
exports.updateEsimStatus = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { iccid } = req.params;
    const { status } = req.body;
    if (!iccid || typeof iccid !== 'string') {
        return next(new appError_1.AppError('ICCID is required', 400));
    }
    if (!status) {
        return next(new appError_1.AppError('Status is required', 400));
    }
    // Validate ICCID format (19-20 digits)
    if (!/^\d{19,20}$/.test(iccid)) {
        return next(new appError_1.AppError('Invalid ICCID format. ICCID must be 19-20 digits.', 400));
    }
    // Update eSIM status
    const { data: esim, error } = await supabase_1.supabase
        .from('esims')
        .update({ status })
        .eq('iccid', iccid)
        .select()
        .single();
    if (error) {
        return next(new appError_1.AppError('Error updating eSIM status', 500));
    }
    if (!esim) {
        return next(new appError_1.AppError('eSIM not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: esim,
    });
});
// Admin-only function to get eSIM usage statistics
exports.getEsimUsageStats = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { data: stats, error } = await supabase_1.supabase
        .from('esims')
        .select('status')
        .then(result => {
        if (result.error)
            return result;
        const statusCounts = result.data?.reduce((acc, esim) => {
            acc[esim.status] = (acc[esim.status] || 0) + 1;
            return acc;
        }, {}) || {};
        return { data: statusCounts, error: null };
    });
    if (error) {
        return next(new appError_1.AppError('Error fetching eSIM statistics', 500));
    }
    res.status(200).json({
        status: 'success',
        data: stats,
    });
});
// Admin-only function to get eSIMs by user ID
exports.getEsimsByUserId = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { userId } = req.params;
    const { data: esims, error } = await supabase_1.supabase
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
        activation_date
      )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) {
        return next(new appError_1.AppError('Error fetching eSIMs', 500));
    }
    res.status(200).json({
        status: 'success',
        data: esims,
    });
});
/**
 * Get account balance from Roamify API
 */
exports.getAccountBalanceFromRoamify = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const roamifyUrl = `${ROAMIFY_API_BASE}/api/balance`;
        const roamifyApiKey = process.env.ROAMIFY_API_KEY;
        if (!roamifyApiKey) {
            return next(new appError_1.AppError('Roamify API key not configured', 500));
        }
        const response = await axios_1.default.get(roamifyUrl, {
            headers: {
                'Authorization': `Bearer ${roamifyApiKey}`,
                'User-Agent': 'esim-marketplace/1.0'
            }
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        if (error.response) {
            // Forward error from Roamify
            return res.status(error.response.status).json(error.response.data);
        }
        next(new appError_1.AppError('Failed to get account balance from Roamify', 500));
    }
});
/**
 * Get eSIM usage by ICCID for balance check
 */
exports.getEsimUsageByIccid = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { iccid } = req.params;
    console.log(`[DEBUG] getEsimUsageByIccid called with ICCID: ${iccid}`);
    if (!iccid) {
        console.log(`[DEBUG] No ICCID provided`);
        return next(new appError_1.AppError('ICCID is required', 400));
    }
    // Validate ICCID format (19-20 digits)
    if (!/^\d{19,20}$/.test(iccid)) {
        console.log(`[DEBUG] Invalid ICCID format: ${iccid}`);
        return next(new appError_1.AppError('Invalid ICCID format. ICCID must be 19-20 digits.', 400));
    }
    try {
        console.log(`[DEBUG] Fetching order details for ICCID: ${iccid}`);
        // Get order details from database first
        const { data: order, error: orderError } = await supabase_1.supabase
            .from('orders')
            .select('id, data_amount, validity_days, status, created_at, package_id')
            .eq('iccid', iccid)
            .single();
        console.log(`[DEBUG] Order query result:`, { order, orderError });
        if (orderError && orderError.code !== 'PGRST116') {
            console.error(`[DEBUG] Database error:`, orderError);
            return next(new appError_1.AppError(`Error fetching order details: ${orderError.message}`, 500));
        }
        if (!order) {
            console.log(`[DEBUG] No order found for ICCID: ${iccid}`);
            return next(new appError_1.AppError('eSIM not found with this ICCID', 404));
        }
        console.log(`[DEBUG] Order found:`, order);
        let usage = null;
        let usageError = null;
        // Try to get usage details from Roamify
        try {
            usage = await roamifyService_1.RoamifyService.getEsimUsageDetails(iccid);
            // Based on the logs, Roamify returns data in a specific format
            // We need to handle the case where the response might have nested data
            console.log(`[DEBUG] Raw Roamify response:`, usage);
            // Validate Roamify data - if it returns null/0 values, use database data instead
            if (!usage.dataLimit || usage.dataLimit === 0) {
                console.log(`[DEBUG] Roamify returned invalid dataLimit (${usage.dataLimit}), using database data`);
                usage.dataLimit = order.data_amount || 1; // Use 1GB as fallback if database is null
                usage.dataRemaining = (order.data_amount || 1) - (usage.dataUsed || 0);
            }
            if (usage.dataRemaining === null || usage.dataRemaining === undefined) {
                console.log(`[DEBUG] Roamify returned invalid dataRemaining (${usage.dataRemaining}), calculating from database`);
                usage.dataRemaining = (order.data_amount || 1) - (usage.dataUsed || 0);
            }
        }
        catch (error) {
            usageError = error;
            console.warn(`Failed to get usage from Roamify for ICCID ${iccid}:`, error.message);
            // Fallback: Provide mock usage data based on order
            usage = {
                dataUsed: 0, // Mock: No data used yet
                dataLimit: order.data_amount || 1,
                dataRemaining: order.data_amount || 1, // Should be full amount when unused
                status: order.status === 'completed' ? 'active' : 'inactive',
                lastUpdated: new Date().toISOString()
            };
        }
        res.status(200).json({
            status: 'success',
            data: {
                iccid,
                dataUsed: usage.dataUsed || 0,
                dataLimit: usage.dataLimit || 1, // Use extracted data from Roamify
                dataRemaining: usage.dataRemaining != null ? usage.dataRemaining : 1,
                status: usage.status,
                expiry: order.created_at,
                createdAt: order.created_at,
                orderId: order.id,
                dataSource: usageError ? 'fallback' : 'roamify',
                lastUpdated: usage.lastUpdated,
            },
        });
    }
    catch (error) {
        console.error('Error in getEsimUsageByIccid:', error);
        // Ensure we always return JSON, never HTML
        if (error.response && error.response.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
            return next(new appError_1.AppError('External API returned invalid response', 502));
        }
        next(new appError_1.AppError('Failed to get eSIM usage details', 500));
    }
});
//# sourceMappingURL=esimController.js.map