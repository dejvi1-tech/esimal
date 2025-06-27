import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ErrorMessages,
} from '../utils/errors';

console.log('updatePackage controller loaded');

// Create admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin-only function to create package
export const createPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      price,
      dataAmount,
      validityDays,
      country,
      operator,
      type,
    } = req.body;

    // Validate required fields
    if (!name || !price || !dataAmount || !validityDays || !country || !operator || !type) {
      throw new ValidationError(ErrorMessages.validation.required('All package fields'));
    }

    if (price <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Price'));
    }

    if (dataAmount <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Data amount'));
    }

    if (validityDays <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Validity days'));
    }

    // Check if package with same name exists
    const { data: existingPackage } = await supabase
      .from('packages')
      .select('id')
      .eq('name', name)
      .single();

    if (existingPackage) {
      throw new ConflictError(ErrorMessages.package.nameExists);
    }

    // Create package
    const { data: newPackage, error } = await supabase
      .from('packages')
      .insert([
        {
          name,
          description,
          price,
          data_amount: dataAmount,
          validity_days: validityDays,
          country,
          operator,
          type,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      status: 'success',
      data: newPackage,
    });
  } catch (error) {
    next(error);
  }
};

// Admin-only function to get all packages
export const getAllPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({
      status: 'success',
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

// Admin-only function to get package by ID
export const getPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { data: pkg, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!pkg) {
      throw new NotFoundError('Package');
    }

    res.status(200).json({
      status: 'success',
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

// Admin-only function to update package
export const updatePackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate required fields
    if (updateData.price !== undefined && updateData.price <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Price'));
    }

    if (updateData.dataAmount !== undefined && updateData.dataAmount <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Data amount'));
    }

    if (updateData.validityDays !== undefined && updateData.validityDays <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Validity days'));
    }

    // Update package
    const { data: updatedPackage, error } = await supabase
      .from('packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedPackage) {
      throw new NotFoundError('Package');
    }

    res.status(200).json({
      status: 'success',
      data: updatedPackage,
    });
  } catch (error) {
    next(error);
  }
};

// Admin-only function to delete package
export const deletePackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getCountries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let allCountries: string[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from('packages')
        .select('country_name')
        .neq('country_name', null)
        .range(offset, offset + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allCountries.push(...data.map((pkg: any) => pkg.country_name));
      hasMore = data.length === batchSize;
      offset += batchSize;
    }

    // Deduplicate and sort
    const uniqueCountries = Array.from(new Set(allCountries)).filter(Boolean).sort();

    res.status(200).json({
      status: 'success',
      data: uniqueCountries,
    });
  } catch (error) {
    next(error);
  }
};

// Get section packages (e.g., most popular)
export const getSectionPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.query;
    if (slug !== 'most-popular') {
      return res.status(400).json({ status: 'error', message: 'Invalid section slug' });
    }
    const { data: packages, error } = await supabase
      .from('my_packages')
      .select('*')
      .eq('show_on_frontend', true)
      .order('homepage_order', { ascending: true });
    if (error) throw error;
    res.status(200).json({ status: 'success', data: packages });
  } catch (error) {
    next(error);
  }
}; 