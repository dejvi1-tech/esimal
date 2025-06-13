import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../services/emailService';
import { logger } from '../utils/logger';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      throw new AppError(400, authError.message);
    }

    if (!authData.user) {
      throw new AppError(400, 'Failed to create user');
    }

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome to eSIM Marketplace!',
      html: `
        <h1>Welcome to eSIM Marketplace!</h1>
        <p>Thank you for registering. Your account has been created successfully.</p>
        <p>You can now log in and start purchasing eSIM packages.</p>
      `,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName,
          lastName,
        },
        session: authData.session,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(401, error.message);
    }

    if (!data.user) {
      throw new AppError(401, 'Invalid credentials');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata.first_name,
          lastName: data.user.user_metadata.last_name,
        },
        session: data.session,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AppError(400, error.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      throw new AppError(400, error.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Password reset instructions sent to email',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = req.body;

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new AppError(400, error.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new AppError(401, 'Not authenticated');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.user_metadata.first_name,
          lastName: user.user_metadata.last_name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}; 