"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountBalanceFromRoamify = exports.getUserTransactions = exports.getUserById = exports.getAllUsers = void 0;
const supabase_1 = require("../config/supabase");
const appError_1 = require("../utils/appError");
const asyncHandler_1 = require("../utils/asyncHandler");
const axios_1 = __importDefault(require("axios"));
// At top of file
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
// Admin-only function to get all users
exports.getAllUsers = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { data: users, error } = await supabase_1.supabase
        .from('users')
        .select('id, email, "firstName", "lastName", role, balance, currency, created_at, last_login_at')
        .order('created_at', { ascending: false });
    if (error) {
        return next(new appError_1.AppError('Error fetching users', 500));
    }
    res.status(200).json({
        status: 'success',
        data: users,
    });
});
// Admin-only function to get user by ID
exports.getUserById = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { data: user, error } = await supabase_1.supabase
        .from('users')
        .select('id, email, "firstName", "lastName", role, balance, currency, stripe_customer_id, created_at, last_login_at')
        .eq('id', id)
        .single();
    if (error) {
        return next(new appError_1.AppError('Error fetching user', 500));
    }
    if (!user) {
        return next(new appError_1.AppError('User not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: user,
    });
});
// Admin-only function to get user transactions
exports.getUserTransactions = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    const { limit = '10' } = req.query;
    const { data: transactions, error } = await supabase_1.supabase
        .from('transactions')
        .select('id, amount, type, status, created_at, description')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(Number(limit));
    if (error) {
        return next(new appError_1.AppError('Error fetching transactions', 500));
    }
    res.status(200).json({
        status: 'success',
        data: transactions,
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
//# sourceMappingURL=accountController.js.map