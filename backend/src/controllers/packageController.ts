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
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { parseValidityToDays } from '../utils/esimUtils';

// At top of file
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

// Create admin client for operations that need service role
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Interface for Roamify raw package data
interface RoamifyRawPackage {
  id?: string;
  package_id?: string;
  country?: string;
  country_name?: string;
  region?: string;
  description?: string;
  data?: string;
  dataAmount?: string;
  day?: number;
  validity?: string;
  price?: number;
  amount?: number;
}

console.log('updatePackage controller loaded');

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
      days,
      country,
      operator,
      type,
    } = req.body;

    // Validate required fields
    if (!name || !price || !dataAmount || !days || !country || !operator || !type) {
      throw new ValidationError(ErrorMessages.validation.required('All package fields'));
    }

    if (price <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Price'));
    }

    if (dataAmount <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Data amount'));
    }

    if (days <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Days'));
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

    // Parse validity string to integer days
    let validityStr = req.body.validity || req.body.days || days || '';
    let parsedDays = null;
    if (typeof validityStr === 'string') {
      parsedDays = parseValidityToDays(validityStr);
    } else if (typeof validityStr === 'number') {
      parsedDays = validityStr;
    }
    if (parsedDays === null || parsedDays <= 0) {
      logger.warn(`Could not parse days string '${validityStr}' for package create name=${name}`);
      return res.status(400).json({ status: 'error', message: 'Invalid or missing days field' });
    }
    // Overwrite all relevant fields
    const packageData = {
      name,
      description,
      price,
      data_amount: dataAmount,
      days: parsedDays,
      country,
      operator,
      type,
    };
    // Create package
    const { data: newPackage, error } = await supabase
      .from('packages')
      .insert([packageData])
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
    const countryCode = req.query.country_code as string;
    console.log(`[API] /api/packages received country_code:`, countryCode); // DEBUG LOG
    
    let query = supabaseAdmin
      .from('my_packages')
      .select('*')
      .eq('visible', true)
      .eq('show_on_frontend', true);
    
    // If country_code is provided, filter by it. Otherwise, return all packages (for admin panel)
    if (countryCode && typeof countryCode === 'string' && countryCode.length === 2) {
      query = query.eq('country_code', countryCode.toUpperCase());
      console.log(`[API] /api/packages filtering by country_code:`, countryCode);
    } else {
      console.log(`[API] /api/packages returning all packages (no country filter)`);
    }
    
    const { data: packages, error } = await query.order('sale_price', { ascending: true });
    
    if (error) {
      throw error;
    }
    console.log(`[API] /api/packages returning ${packages?.length || 0} packages`); // DEBUG LOG
    res.status(200).json({
      status: 'success',
      data: packages,
    });
  } catch (error) {
    logger.error('[API] /api/packages error', {
      error: error instanceof Error ? error.stack || error.message : error,
      country_code: req.query.country_code,
      path: req.path,
      method: req.method,
      time: new Date().toISOString(),
    });
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

    if (updateData.days !== undefined && updateData.days <= 0) {
      throw new ValidationError(ErrorMessages.validation.positive('Days'));
    }

    // Parse validity string to integer days
    let validityStr = updateData.validity || updateData.days || '';
    let parsedDays = null;
    if (typeof validityStr === 'string') {
      parsedDays = parseValidityToDays(validityStr);
    } else if (typeof validityStr === 'number') {
      parsedDays = validityStr;
    }
    if (parsedDays === null) {
      logger.warn(`Could not parse days string '${validityStr}' for package update id=${id}`);
    }
    // Overwrite all relevant fields
    updateData.validity = validityStr;
    updateData.days = parsedDays;

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

// Admin-only function to delete package from my_packages table
export const deleteMyPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('my_packages')
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
    // Get all countries at once without pagination
    const { data: countries, error } = await supabaseAdmin
      .from('packages')
      .select('country_name')
      .neq('country_name', null)
      .neq('country_name', '')
      .order('country_name', { ascending: true });

    if (error) throw error;

    // Extract unique country names
    const uniqueCountries = Array.from(new Set(countries?.map(c => c.country_name) || [])).filter(Boolean).sort();

    res.status(200).json({
      status: 'success',
      data: uniqueCountries,
      count: uniqueCountries.length
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
): Promise<void> => {
  try {
    const { slug } = req.query;
    
    if (slug !== 'most-popular') {
      res.status(400).json({ 
        status: 'error', 
        message: 'Invalid section slug' 
      });
      return;
    }

    const { data: packages, error } = await supabaseAdmin
      .from('my_packages')
      .select('*')
      .eq('show_on_frontend', true)
      .eq('location_slug', 'most-popular')
      .order('homepage_order', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`Found ${packages?.length || 0} most popular packages`);
    res.json(packages || []);
  } catch (error) {
    next(error);
  }
};

// Search packages by country and language
export const searchPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { country, lang } = req.query;
    
    if (!country) {
      res.status(400).json({ 
        status: 'error', 
        message: 'Country parameter is required' 
      });
      return;
    }

    let packages, error;
    if (country === 'EU') {
      // For Europe, match by country_code
      ({ data: packages, error } = await supabase
        .from('my_packages')
        .select('*')
        .eq('country_code', 'EU')
        .order('sale_price', { ascending: true }));
    } else {
      // For other countries, match by country_name
      ({ data: packages, error } = await supabase
        .from('my_packages')
        .select('*')
        .ilike('country_name', `%${country}%`)
        .order('sale_price', { ascending: true }));
    }

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    res.json(packages || []);
  } catch (error) {
    console.error('Search packages error:', error);
    next(error);
  }
};

// Secure admin endpoint: Get all my_packages
export const getMyPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from('my_packages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ status: 'success', data: packages });
  } catch (error) {
    next(error);
  }
};

// Secure admin endpoint: Get all Roamify packages with pagination
export const getAllRoamifyPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Fetching packages from database...');
    
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Check if this is a request for all packages (limit > 1000)
    if (limit > 1000) {
      console.log('Large limit detected, fetching all packages without pagination...');
      
      // Get total count first
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from('packages')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) {
        console.error('Error getting total count:', countError);
        throw countError;
      }

      // Fetch all packages in chunks of 1000 (Supabase limit)
      const allPackages: any[] = [];
      const chunkSize = 1000;
      let offset = 0;
      
      if (!totalCount || totalCount <= 0) {
        console.log('No packages found in database');
        return res.status(200).json({
          status: 'success',
          data: [],
          count: 0,
          pagination: {
            page: 1,
            limit: 0,
            totalCount: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        });
      }
      
      while (offset < totalCount) {
        console.log(`Fetching chunk ${Math.floor(offset / chunkSize) + 1}/${Math.ceil(totalCount / chunkSize)} (offset ${offset}, limit ${chunkSize})`);
        
        const { data: chunk, error } = await supabaseAdmin
          .from('packages')
          .select('*')
          .eq('is_active', true)
          .order('country_name', { ascending: true })
          .range(offset, offset + chunkSize - 1);

        if (error) {
          console.error('Error fetching packages chunk:', error);
          throw error;
        }

        if (chunk && chunk.length > 0) {
          allPackages.push(...chunk);
          console.log(`Fetched ${chunk.length} packages in this chunk`);
        }

        offset += chunkSize;
      }

      console.log(`Found ${allPackages.length} packages in database (all packages)`);

      // Map the packages to the expected format for frontend compatibility
      const mappedPackages = allPackages.map((pkg: any) => ({
        id: pkg.id,
        country: pkg.country_name,
        region: pkg.region || 'Global',
        description: `${pkg.data_amount} - ${pkg.days} days`,
        data: pkg.data_amount,
        validity: `${pkg.days} days`,
        price: pkg.price,
        // Add additional fields for backward compatibility
        packageId: pkg.id,
        package: pkg.name,
        packageName: pkg.name,
        name: pkg.name,
        country_name: pkg.country_name,
        country_code: pkg.country_code,
        dataAmount: pkg.data_amount,
        days: pkg.days,
        base_price: pkg.price,
        operator: pkg.operator,
        features: pkg.features,
        is_active: pkg.is_active,
        created_at: pkg.created_at,
        updated_at: pkg.updated_at
      }));

      // Log a sample package for debugging
      if (mappedPackages.length > 0) {
        console.log('Sample mapped package:', mappedPackages[0]);
      }

      return res.status(200).json({
        status: 'success',
        data: mappedPackages,
        count: mappedPackages.length,
        pagination: {
          page: 1,
          limit: mappedPackages.length,
          totalCount,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }
    
    // Original pagination logic for normal requests
    const offset = (page - 1) * limit;
    
    // Get total count first
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('packages')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      console.error('Error getting total count:', countError);
      throw countError;
    }

    // Get packages from the packages table with pagination
    const { data: packages, error } = await supabaseAdmin
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('country_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching packages from database:', error);
      throw error;
    }

    console.log(`Found ${packages?.length || 0} packages in database (page ${page}, limit ${limit})`);

    // Map the packages to the expected format for frontend compatibility
    const mappedPackages = (packages || []).map((pkg: any) => ({
      id: pkg.id,
      country: pkg.country_name,
      region: pkg.region || 'Global',
      description: `${pkg.data_amount} - ${pkg.days} days`,
      data: pkg.data_amount,
      validity: `${pkg.days} days`,
      price: pkg.price,
      // Add additional fields for backward compatibility
      packageId: pkg.id,
      package: pkg.name,
      packageName: pkg.name,
      name: pkg.name,
      country_name: pkg.country_name,
      country_code: pkg.country_code,
      dataAmount: pkg.data_amount,
      days: pkg.days,
      base_price: pkg.price,
      operator: pkg.operator,
      features: pkg.features,
      is_active: pkg.is_active,
      created_at: pkg.created_at,
      updated_at: pkg.updated_at
    }));

    // Calculate pagination info
    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Log a sample package for debugging
    if (mappedPackages.length > 0) {
      console.log('Sample mapped package:', mappedPackages[0]);
    }

    return res.status(200).json({
      status: 'success',
      data: mappedPackages,
      count: mappedPackages.length,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching Roamify packages:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch Roamify packages' });
  }
};

// Secure admin endpoint: Get distinct countries from packages
export const getPackageCountries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get distinct countries from packages table
    const { data: countries, error } = await supabaseAdmin
      .from('packages')
      .select('country_name')
      .neq('country_name', null)
      .neq('country_name', '')
      .order('country_name', { ascending: true });

    if (error) throw error;

    // Extract unique country names
    const uniqueCountries = Array.from(new Set(countries?.map(c => c.country_name) || [])).filter(Boolean).sort();

    res.status(200).json({
      status: 'success',
      data: uniqueCountries,
      count: uniqueCountries.length
    });
  } catch (error) {
    console.error('Error fetching package countries:', error);
    next(error);
  }
};

// Secure admin endpoint: Deduplicate packages
export const deduplicatePackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all packages from the packages table (not my_packages)
    const { data: allPackages, error: fetchError } = await supabaseAdmin
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (!allPackages || allPackages.length === 0) {
      return res.status(200).json({ 
        status: 'success', 
        message: 'No packages to deduplicate',
        removedCount: 0 
      });
    }

    console.log(`Starting deduplication of ${allPackages.length} packages`);

    // Step 1: Remove duplicate IDs by keeping the most recent version
    const idMap = new Map();
    const packagesToKeep: any[] = [];
    const packagesToDelete: string[] = [];

    allPackages.forEach(pkg => {
      const id = pkg.reseller_id || pkg.id;
      if (id) {
        if (idMap.has(id)) {
          // Keep the one with more complete information or more recent
          const existing = idMap.get(id);
          const newPkgScore = calculateCompleteness(pkg);
          const existingScore = calculateCompleteness(existing);
          
          if (newPkgScore > existingScore || 
              (newPkgScore === existingScore && new Date(pkg.created_at) > new Date(existing.created_at))) {
            // Replace existing with new package
            packagesToDelete.push(existing.id);
            idMap.set(id, pkg);
          } else {
            // Keep existing, mark new for deletion
            packagesToDelete.push(pkg.id);
          }
        } else {
          idMap.set(id, pkg);
        }
      } else {
        // Package without reseller_id, keep it
        packagesToKeep.push(pkg);
      }
    });

    // Add unique ID packages to keep list
    packagesToKeep.push(...Array.from(idMap.values()));

    // Step 2: Remove duplicate combinations (country + data + days + price)
    const combinationMap = new Map();
    const finalPackagesToKeep: any[] = [];
    let combinationDuplicates = 0;

    packagesToKeep.forEach(pkg => {
      const country = pkg.country_name || pkg.country || '';
      const data = pkg.data_amount || pkg.data || '';
      const days = pkg.days || '';
      const price = pkg.price || pkg.base_price || '';
      
      const combinationKey = `${country}|${data}|${days}|${price}`;
      
      if (combinationMap.has(combinationKey)) {
        // Duplicate combination found, mark for deletion
        packagesToDelete.push(pkg.id);
        combinationDuplicates++;
      } else {
        combinationMap.set(combinationKey, pkg);
        finalPackagesToKeep.push(pkg);
      }
    });

    // Remove duplicates from database
    if (packagesToDelete.length > 0) {
      console.log(`Attempting to delete ${packagesToDelete.length} duplicate packages...`);
      
      // Delete in batches to avoid potential issues with large arrays
      const batchSize = 100;
      for (let i = 0; i < packagesToDelete.length; i += batchSize) {
        const batch = packagesToDelete.slice(i, i + batchSize);
        const { error: deleteError } = await supabaseAdmin
          .from('packages')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError);
          throw deleteError;
        }
      }
      
      console.log(`Successfully deleted ${packagesToDelete.length} duplicate packages`);
    }

    console.log(`Deduplication completed: Removed ${packagesToDelete.length} duplicate packages`);
    console.log(`- ID duplicates: ${packagesToDelete.length - combinationDuplicates}`);
    console.log(`- Combination duplicates: ${combinationDuplicates}`);

    res.status(200).json({
      status: 'success',
      message: `Successfully removed ${packagesToDelete.length} duplicate packages`,
      removedCount: packagesToDelete.length,
      remainingCount: finalPackagesToKeep.length,
      details: {
        idDuplicates: packagesToDelete.length - combinationDuplicates,
        combinationDuplicates: combinationDuplicates
      }
    });
  } catch (error) {
    console.error('Error deduplicating packages:', error);
    next(error);
  }
};

// Helper function to calculate package completeness score
function calculateCompleteness(pkg: any): number {
  let score = 0;
  
  if (pkg.name || pkg.package) score += 2;
  if (pkg.country_name || pkg.country) score += 2;
  if (pkg.country_code) score += 1;
  if (pkg.data_amount || pkg.data) score += 2;
  if (pkg.days) score += 2;
  if (pkg.price || pkg.base_price) score += 2;
  if (pkg.reseller_id) score += 1;
  if (pkg.operator) score += 1;
  if (pkg.features) score += 1;
  
  return score;
}

// Secure admin endpoint: Sync packages from Roamify API to database
export const syncRoamifyPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Starting Roamify packages sync...');
    
    // Fetch all packages from Roamify API (no pagination needed)
    console.log('Fetching packages from Roamify API...');
    
    try {
      const response = await fetch(`${ROAMIFY_API_BASE}/api/esim/packages`, {
        headers: {
          Authorization: `Bearer ${process.env.ROAMIFY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Roamify API error response:`, errorText);
        throw new Error(`Roamify API responded with status: ${response.status} - ${errorText}`);
      }

      const json = await response.json() as { status?: string; data?: { packages?: any[] } };

      // Debug: Log the raw response structure
      console.log('=== RAW ROAMIFY API RESPONSE ===');
      console.log('Response type:', typeof json);
      console.log('Top-level keys:', Object.keys(json || {}));
      console.log('=== END RAW RESPONSE ===');

      // Check if we have the expected response structure: data.packages (array of countries)
      if (!json.data || !json.data.packages || json.data.packages.length === 0) {
        console.log('No packages found in Roamify API response');
        return res.status(200).json({
          status: 'success',
          message: 'No packages found from Roamify API',
          syncedCount: 0
        });
      }

      // Flatten all country packages and attach country info
      const countryObjs = json.data.packages;
      let allPackages: any[] = [];
      
      for (const country of countryObjs) {
        if (country.packages && Array.isArray(country.packages)) {
          for (const pkg of country.packages) {
            allPackages.push({
              ...pkg,
              countryName: country.countryName,
              countryCode: country.countryCode,
              region: country.region,
              geography: country.geography
            });
          }
        }
      }
      
      console.log(`Total packages fetched from Roamify API: ${allPackages.length}`);

      if (allPackages.length === 0) {
        return res.status(200).json({
          status: 'success',
          message: 'No packages found from Roamify API',
          syncedCount: 0
        });
      }

      // Clear existing packages from the packages table
      console.log('Clearing existing packages from database...');
      const { error: deleteError } = await supabaseAdmin
        .from('packages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record
      
      if (deleteError) {
        console.error('Error clearing packages table:', deleteError);
        throw deleteError;
      }
      
      console.log('Cleared existing packages from database');
      
      // Process packages in batches for better performance
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < allPackages.length; i += batchSize) {
        const batch = allPackages.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allPackages.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, allPackages.length)} of ${allPackages.length})`);
        
        const batchData = batch.map(pkg => {
          try {
            // Convert dataAmount from MB to GB if needed
            let dataStr = pkg.dataAmount;
            if (typeof pkg.dataAmount === 'number') {
              if (pkg.isUnlimited) {
                dataStr = 'Unlimited';
              } else if (pkg.dataAmount > 1024) {
                dataStr = `${Math.round(pkg.dataAmount / 1024)}GB`;
              } else {
                dataStr = `${pkg.dataAmount}MB`;
              }
            }

            // Parse validity string to integer days
            let validityStr = pkg.validity || pkg.days || '';
            let parsedDays = null;
            if (typeof validityStr === 'string') {
              parsedDays = parseValidityToDays(validityStr);
            } else if (typeof validityStr === 'number') {
              parsedDays = validityStr;
            }
            if (parsedDays === null) {
              console.warn(`Could not parse days string '${validityStr}' for package ${pkg.package}`);
            }

            // Validate country_code format
            let countryCode = 'XX'; // Default fallback
            if (pkg.countryCode) {
              countryCode = pkg.countryCode.toUpperCase().slice(0, 2);
            }

            // Only insert if we have all required fields
            const missingFields = [];
            if (!pkg.package) missingFields.push('package');
            if (!pkg.price) missingFields.push('price');
            if (!dataStr) missingFields.push('dataStr');
            if (!parsedDays) missingFields.push('days');
            if (!pkg.countryName) missingFields.push('countryName');
            if (missingFields.length > 0) {
              console.log(`Skipping package due to missing fields [${missingFields.join(', ')}]:`, pkg.package);
              return null;
            }

            return {
              id: uuidv4(),
              name: pkg.package,
              description: pkg.package || '',
              price: pkg.price,
              data_amount: dataStr,
              days: parsedDays,
              country_code: countryCode,
              country_name: pkg.countryName,
              operator: 'Roamify',
              type: 'initial',
              is_active: true,
              features: {
                packageId: pkg.packageId,
                plan: pkg.plan,
                activation: pkg.activation,
                isUnlimited: pkg.isUnlimited,
                withHotspot: pkg.withHotspot,
                withDataRoaming: pkg.withDataRoaming,
                withUsageCheck: pkg.withUsageCheck,
                region: pkg.region,
                geography: pkg.geography
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error processing package:`, error);
            console.error('Package data:', pkg);
            return null;
          }
        }).filter(Boolean);

        if (batchData.length > 0) {
          try {
            const { error } = await supabaseAdmin.from('packages').upsert(batchData, { onConflict: 'id' });
            
            if (error) {
              console.error(`Error syncing batch:`, error);
              errorCount += batchData.length;
            } else {
              successCount += batchData.length;
              console.log(`✅ Successfully synced ${batchData.length} packages in this batch`);
            }
          } catch (error) {
            console.error(`Error syncing batch:`, error);
            errorCount += batchData.length;
          }
        }
      }

      console.log(`\nPackage sync completed!`);
      console.log(`✅ Successfully synced: ${successCount} packages`);
      console.log(`❌ Failed to sync: ${errorCount} packages`);
      console.log(`Total processed: ${successCount + errorCount} packages`);

      res.status(200).json({
        status: 'success',
        message: `Successfully synced ${successCount} packages from Roamify API`,
        syncedCount: successCount,
        errorCount: errorCount,
        totalProcessed: successCount + errorCount
      });

    } catch (error) {
      console.error('❌ Failed to fetch from Roamify:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error syncing Roamify packages:', error);
    next(error);
  }
};

// Secure admin endpoint: Save package to my_packages
export const savePackage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      id,
      name,
      country_name,
      country_code,
      data_amount,
      days, // Only accept days
      base_price,
      sale_price,
      profit,
      reseller_id,
      region,
      show_on_frontend,
      location_slug,
      homepage_order
    } = req.body;

    // --- DAYS VALIDATION & COERCION ---
    let parsedDays: number | null = null;
    if (typeof days === 'number') {
      parsedDays = days;
    } else if (typeof days === 'string') {
      // Try to parse string to integer days
      parsedDays = parseValidityToDays(days);
    }
    // Check for missing, null, zero, negative, or non-integer
    if (
      parsedDays === null ||
      typeof parsedDays !== 'number' ||
      !Number.isInteger(parsedDays) ||
      parsedDays <= 0
    ) {
      throw new ValidationError('days must be a positive integer greater than zero');
    }

    // Validate required fields
    if (!name || !country_name || !country_code || !data_amount || !base_price || !sale_price) {
      throw new ValidationError('Missing required fields: name, country_name, country_code, data_amount, days, base_price, sale_price');
    }

    // Calculate profit if not provided
    const calculatedProfit = profit !== undefined ? profit : sale_price - base_price;

    // Prepare package data (no 'validity' field)
    const packageData: {
      id: string;
      name: string;
      country_name: string;
      country_code: string;
      data_amount: any;
      days: any;
      base_price: any;
      sale_price: any;
      profit: any;
      reseller_id: any;
      region: any;
      visible: boolean;
      show_on_frontend: any;
      location_slug: any;
      homepage_order: any;
      created_at: string;
      updated_at: string;
    } = {
      id: id || uuidv4(), // Generate new UUID if not provided
      name,
      country_name,
      country_code: country_code.toUpperCase(),
      data_amount,
      days: parsedDays, // Always a positive integer
      base_price,
      sale_price,
      profit: calculatedProfit,
      reseller_id: reseller_id || null,
      region: region || null,
      visible: true, // Default to visible
      show_on_frontend: show_on_frontend !== undefined ? show_on_frontend : true,
      location_slug: location_slug || null,
      homepage_order: homepage_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert package (insert or update)
    const { data: savedPackage, error } = await supabaseAdmin
      .from('my_packages')
      .upsert([packageData], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      logger.error('Error saving package:', error);
      throw error;
    }

    logger.info(`Package saved successfully: ${savedPackage.id} - ${savedPackage.name}`);

    res.status(200).json({
      status: 'success',
      data: savedPackage,
      message: 'Package saved successfully'
    });
  } catch (error) {
    logger.error('Error in savePackage:', error);
    next(error);
  }
};