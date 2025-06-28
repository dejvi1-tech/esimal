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

// At top of file
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

// Create admin client for operations that need service role
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { data: packages, error } = await supabase
      .from('my_packages')
      .select('*')
      .eq('show_on_frontend', true)
      .order('homepage_order', { ascending: true });

    if (error) {
      throw error;
    }

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

    // Query packages by country name (case-insensitive)
    const { data: packages, error } = await supabase
      .from('my_packages')
      .select('*')
      .ilike('country_name', `%${country}%`)
      .order('sale_price', { ascending: true });

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

// Secure admin endpoint: Get all Roamify packages
export const getAllRoamifyPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Fetching ALL packages from Roamify API...');
    
    let allPackages: any[] = [];
    let page = 1;
    const limit = 1000;

    while (true) {
      console.log(`Fetching page ${page} from Roamify API...`);
      
      try {
        const response = await fetch(`${ROAMIFY_API_BASE}/api/packages?page=${page}&limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${process.env.ROAMIFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        const json = await response.json() as { data?: any[] };

        if (!json.data || json.data.length === 0) {
          console.log(`No more data on page ${page}, stopping pagination`);
          break;
        }

        console.log(`Page ${page}: Found ${json.data.length} packages`);
        allPackages.push(...json.data);
        page++;
        
        // Safety check to prevent infinite loops
        if (page > 50) {
          console.log('Reached maximum page limit (50), stopping pagination');
          break;
        }
      } catch (error) {
        console.error('❌ Failed to fetch from Roamify:', ROAMIFY_API_BASE, error);
        throw error;
      }
    }

    console.log(`Total packages fetched from Roamify API: ${allPackages.length}`);

    return res.status(200).json({
      status: 'success',
      data: allPackages,
      count: allPackages.length,
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
      const days = pkg.validity_days || pkg.days || pkg.day || '';
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
  if (pkg.validity_days || pkg.days || pkg.day) score += 2;
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
    
    // Fetch all packages from Roamify API using simple pagination
    let allPackages: any[] = [];
    let page = 1;
    const limit = 1000;

    while (true) {
      console.log(`Fetching page ${page} from Roamify API for sync...`);
      
      try {
        const response = await fetch(`${ROAMIFY_API_BASE}/api/packages?page=${page}&limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${process.env.ROAMIFY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        const json = await response.json() as { data?: any[] };

        if (!json.data || json.data.length === 0) {
          console.log(`No more data on page ${page}, stopping pagination`);
          break;
        }

        console.log(`Page ${page}: Found ${json.data.length} packages for sync`);
        allPackages.push(...json.data);
        page++;
        
        // Safety check to prevent infinite loops
        if (page > 50) {
          console.log('Reached maximum page limit (50), stopping pagination');
          break;
        }
      } catch (error) {
        console.error('❌ Failed to fetch from Roamify:', ROAMIFY_API_BASE, error);
        throw error;
      }
    }
    
    if (allPackages.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No packages found from Roamify API',
        syncedCount: 0
      });
    }
    
    console.log(`Fetched ${allPackages.length} packages from Roamify API, syncing to database...`);
    
    // Clear existing packages
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
          // Map data_amount to string as required by schema
          let dataAmountStr = null;
          if (pkg.isUnlimited) {
            dataAmountStr = 'Unlimited';
          } else if (pkg.dataAmount) {
            // Convert MB to GB and format as required
            const gbAmount = Math.round(pkg.dataAmount / 1024);
            dataAmountStr = `${gbAmount}GB`;
          }

          // Validate country_code format
          let countryCode = null;
          if (pkg.country_code) {
            countryCode = pkg.country_code.toUpperCase().slice(0, 2);
          }

          // Only insert if we have all required fields
          if (!pkg.package || !pkg.price || !dataAmountStr || !pkg.day || !countryCode || !pkg.country_name) {
            console.log('Skipping package due to missing required fields:', pkg.package);
            return null;
          }

          return {
            id: uuidv4(),
            name: pkg.package,
            description: pkg.package || '',
            price: pkg.price,
            data_amount: dataAmountStr,
            validity_days: pkg.day,
            country_code: countryCode,
            country_name: pkg.country_name,
            operator: 'Roamify',
            type: 'initial',
            is_active: true,
            features: pkg.features || null,
            reseller_id: pkg.packageId || null,
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
            console.log(`✓ Successfully synced ${batchData.length} packages in this batch`);
          }
        } catch (error) {
          console.error(`Error syncing batch:`, error);
          errorCount += batchData.length;
        }
      }
    }

    console.log(`\nPackage sync completed!`);
    console.log(`✓ Successfully synced: ${successCount} packages`);
    console.log(`✗ Failed to sync: ${errorCount} packages`);
    console.log(`Total processed: ${successCount + errorCount} packages`);

    res.status(200).json({
      status: 'success',
      message: `Successfully synced ${successCount} packages from Roamify API`,
      syncedCount: successCount,
      errorCount: errorCount,
      totalProcessed: successCount + errorCount
    });
  } catch (error) {
    console.error('Error syncing Roamify packages:', error);
    next(error);
  }
};