import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../utils/asyncHandler';
import axios from 'axios';

// Admin-only function to get all users
export const getAllUsers = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, balance, currency, created_at, last_login_at')
    .order('created_at', { ascending: false });

  if (error) {
    return next(new AppError('Error fetching users', 500));
  }

  res.status(200).json({
    status: 'success',
    data: users,
  });
});

// Admin-only function to get user by ID
export const getUserById = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role, balance, currency, stripe_customer_id, created_at, last_login_at')
    .eq('id', id)
    .single();

  if (error) {
    return next(new AppError('Error fetching user', 500));
  }

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

// Admin-only function to get user transactions
export const getUserTransactions = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { limit = '10' } = req.query;

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, amount, type, status, created_at, description')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(Number(limit));

  if (error) {
    return next(new AppError('Error fetching transactions', 500));
  }

  res.status(200).json({
    status: 'success',
    data: transactions,
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
    const roamifyUrl = 'https://api.getroamify.com/api/balance';
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