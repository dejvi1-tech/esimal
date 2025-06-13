import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export const createPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, dataAmount, duration, price, country, region } = req.body;

    const { data, error } = await supabase
      .from('packages')
      .insert([
        {
          name,
          description,
          data_amount: dataAmount,
          duration,
          price,
          country,
          region,
          created_by: req.user?.id,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    res.status(201).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { country, region } = req.query;
    let query = supabase.from('packages').select('*');

    if (country) {
      query = query.eq('country', country);
    }

    if (region) {
      query = query.eq('region', region);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(400, error.message);
    }

    res.status(200).json({
      status: 'success',
      results: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getPackageById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new AppError(404, 'Package not found');
    }

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, dataAmount, duration, price, country, region } = req.body;

    const { data, error } = await supabase
      .from('packages')
      .update({
        name,
        description,
        data_amount: dataAmount,
        duration,
        price,
        country,
        region,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(400, error.message);
    }

    if (!data) {
      throw new AppError(404, 'Package not found');
    }

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

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
      throw new AppError(400, error.message);
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 