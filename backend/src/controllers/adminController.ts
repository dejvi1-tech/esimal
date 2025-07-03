import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// Create admin client for privileged operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
import {
  ValidationError,
  NotFoundError,
} from '../utils/errors';
import { validatePackage, batchValidatePackages, clearValidationCache, getValidationCacheStats } from '../middleware/packageValidation';
import { RoamifyService } from '../services/roamifyService';
// Import types for scripts - actual imports will be dynamic
// import { enhancedSync, getCurrentRoamifyPackages, validatePackageMappings } from '../../scripts/scheduledPackageSync';

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
          days,
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

/**
 * Get package health overview
 */
export const getPackageHealthOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info('Getting package health overview...');

    // Get basic stats
    const { count: myPackagesCount } = await supabase
      .from('my_packages')
      .select('*', { count: 'exact', head: true });

    const { count: packagesCount } = await supabase
      .from('packages')
      .select('*', { count: 'exact', head: true });

    // Get recent orders with potential issues
    const { data: recentFailedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, status, metadata')
      .in('status', ['failed', 'pending_esim'])
      .order('created_at', { ascending: false })
      .limit(10);

    // Get validation cache stats
    const cacheStats = getValidationCacheStats();

    // Sample package validation
    const { data: samplePackages } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id')
      .limit(5);

    let validationSample = [];
    if (samplePackages) {
      for (const pkg of samplePackages) {
        const result = await validatePackage(pkg.id);
        validationSample.push({
          id: pkg.id,
          name: pkg.name,
          isValid: result.isValid,
          action: result.action,
          issues: result.issues
        });
      }
    }

    const healthOverview = {
      timestamp: new Date().toISOString(),
      database_stats: {
        my_packages_count: myPackagesCount,
        packages_count: packagesCount
      },
      validation_cache: cacheStats,
      recent_failed_orders: recentFailedOrders?.length || 0,
      sample_validation: validationSample,
      health_score: calculateHealthScore(validationSample, recentFailedOrders?.length || 0)
    };

    res.status(200).json({
      status: 'success',
      data: healthOverview
    });

  } catch (error) {
    logger.error('Error getting package health overview:', error);
    next(error);
  }
};

/**
 * Get sync status and history
 */
export const getSyncStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info('Getting sync status...');

    // Check last sync from packages table
    const { data: lastSyncPackage } = await supabase
      .from('packages')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // Get Roamify API health
    const roamifyHealth = await RoamifyService.checkApiHealth();

    // Get recent package mappings with issues
    const { data: invalidMappings } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id, updated_at')
      .is('reseller_id', null)
      .limit(5);

    const syncStatus = {
      timestamp: new Date().toISOString(),
      last_sync: lastSyncPackage?.updated_at || null,
      roamify_api_healthy: roamifyHealth,
      invalid_mappings_count: invalidMappings?.length || 0,
      invalid_mappings_sample: invalidMappings || [],
      sync_needed: !lastSyncPackage || !roamifyHealth || (invalidMappings?.length || 0) > 0
    };

    res.status(200).json({
      status: 'success',
      data: syncStatus
    });

  } catch (error) {
    logger.error('Error getting sync status:', error);
    next(error);
  }
};

/**
 * Manually trigger package validation
 */
export const triggerPackageValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { packageIds, limit = 10 } = req.body;

    let packagesToValidate = packageIds;

    if (!packagesToValidate) {
      // Get random sample of packages
      const { data: samplePackages } = await supabase
        .from('my_packages')
        .select('id')
        .limit(limit);
      
      packagesToValidate = samplePackages?.map(p => p.id) || [];
    }

    logger.info(`Validating ${packagesToValidate.length} packages...`);

    const validationResults = await batchValidatePackages(packagesToValidate);
    
    const summary = {
      total: packagesToValidate.length,
      valid: 0,
      invalid: 0,
      warnings: 0
    };

    const detailedResults = [];

    for (const [packageId, result] of validationResults) {
      if (result.action === 'proceed') summary.valid++;
      else if (result.action === 'warn') summary.warnings++;
      else summary.invalid++;

      detailedResults.push({
        packageId,
        isValid: result.isValid,
        action: result.action,
        message: result.message,
        issues: result.issues
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        summary,
        results: detailedResults
      }
    });

  } catch (error) {
    logger.error('Error triggering package validation:', error);
    next(error);
  }
};

/**
 * Get invalid packages that need review
 */
export const getInvalidPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit = 50 } = req.query;

    logger.info('Getting invalid packages...');

    // Get packages without reseller_id
    const { data: missingResellerId } = await supabase
      .from('my_packages')
      .select('id, name, country_name, data_amount, days, created_at')
      .is('reseller_id', null)
      .limit(Number(limit));

    // Get current Roamify packages for validation
    const { getCurrentRoamifyPackages } = require('../../scripts/scheduledPackageSync');
    const roamifyPackages = await getCurrentRoamifyPackages();
    const validRoamifyIds = new Set(roamifyPackages.map((p: any) => p.packageId));

    // Get packages with invalid reseller_id
    const { data: packagesWithResellerId } = await supabase
      .from('my_packages')
      .select('id, name, reseller_id, country_name, data_amount, days')
      .not('reseller_id', 'is', null)
      .limit(Number(limit) * 2); // Get more to filter

    const invalidResellerId = packagesWithResellerId?.filter(
      pkg => !validRoamifyIds.has(pkg.reseller_id)
    ).slice(0, Number(limit)) || [];

    const invalidPackages = {
      timestamp: new Date().toISOString(),
      missing_reseller_id: {
        count: missingResellerId?.length || 0,
        packages: missingResellerId || []
      },
      invalid_reseller_id: {
        count: invalidResellerId.length,
        packages: invalidResellerId
      },
      total_invalid: (missingResellerId?.length || 0) + invalidResellerId.length
    };

    res.status(200).json({
      status: 'success',
      data: invalidPackages
    });

  } catch (error) {
    logger.error('Error getting invalid packages:', error);
    next(error);
  }
};

/**
 * Trigger manual sync
 */
export const triggerManualSync = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { options = {} } = req.body;

    logger.info('Triggering manual sync...', options);

    const { enhancedSync } = require('../../scripts/enhancedPackageSync');
    const syncResult = await enhancedSync(options);

    res.status(200).json({
      status: 'success',
      message: 'Sync completed successfully',
      data: syncResult
    });

  } catch (error) {
    logger.error('Error triggering manual sync:', error);
    res.status(500).json({
      status: 'error',
      message: 'Sync failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Clear validation cache
 */
export const clearPackageValidationCache = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const statsBefore = getValidationCacheStats();
    clearValidationCache();
    const statsAfter = getValidationCacheStats();

    logger.info('Package validation cache cleared');

    res.status(200).json({
      status: 'success',
      message: 'Validation cache cleared',
      data: {
        before: statsBefore,
        after: statsAfter
      }
    });

  } catch (error) {
    logger.error('Error clearing validation cache:', error);
    next(error);
  }
};

/**
 * Calculate health score based on validation results and failed orders
 */
function calculateHealthScore(validationSample: any[], failedOrdersCount: number): number {
  if (validationSample.length === 0) return 50; // neutral score if no data

  const validCount = validationSample.filter(p => p.isValid).length;
  const validationScore = (validCount / validationSample.length) * 100;
  
  // Reduce score based on failed orders
  const failuresPenalty = Math.min(failedOrdersCount * 5, 30); // max 30% penalty
  
  return Math.max(0, validationScore - failuresPenalty);
}

// Deduplicate my_packages table
export const deduplicateMyPackages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all packages from the my_packages table
    const { data: allPackages, error: fetchError } = await supabaseAdmin
      .from('my_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (!allPackages || allPackages.length === 0) {
      return res.status(200).json({ 
        status: 'success', 
        message: 'No packages to deduplicate in my_packages',
        removedCount: 0 
      });
    }

    console.log(`Starting deduplication of ${allPackages.length} packages in my_packages table`);

    // Step 1: Remove duplicate reseller_ids by keeping the most recent version
    const resellerIdMap = new Map();
    const packagesToKeep: any[] = [];
    const packagesToDelete: string[] = [];

    allPackages.forEach((pkg: any) => {
      if (pkg.reseller_id) {
        if (resellerIdMap.has(pkg.reseller_id)) {
          // Keep the one with more complete information or more recent
          const existing = resellerIdMap.get(pkg.reseller_id);
          const newPkgScore = calculateMyPackageCompleteness(pkg);
          const existingScore = calculateMyPackageCompleteness(existing);
          
          if (newPkgScore > existingScore || 
              (newPkgScore === existingScore && new Date(pkg.created_at) > new Date(existing.created_at))) {
            // Replace existing with new package
            packagesToDelete.push(existing.id);
            resellerIdMap.set(pkg.reseller_id, pkg);
          } else {
            // Keep existing, mark new for deletion
            packagesToDelete.push(pkg.id);
          }
        } else {
          resellerIdMap.set(pkg.reseller_id, pkg);
        }
      } else {
        // Package without reseller_id, keep it for now
        packagesToKeep.push(pkg);
      }
    });

    // Add unique reseller_id packages to keep list
    packagesToKeep.push(...Array.from(resellerIdMap.values()));

    // Step 2: Remove duplicate combinations (country + data + days + sale_price)
    const combinationMap = new Map();
    const finalPackagesToKeep: any[] = [];
    let combinationDuplicates = 0;

    packagesToKeep.forEach((pkg: any) => {
      const country = pkg.country_name || '';
      const data = pkg.data_amount || '';
      const days = pkg.days || '';
      const price = pkg.sale_price || pkg.base_price || '';
      
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
      console.log(`Attempting to delete ${packagesToDelete.length} duplicate packages from my_packages...`);
      
      // Delete in batches to avoid potential issues with large arrays
      const batchSize = 100;
      for (let i = 0; i < packagesToDelete.length; i += batchSize) {
        const batch = packagesToDelete.slice(i, i + batchSize);
        const { error: deleteError } = await supabaseAdmin
          .from('my_packages')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError);
          throw deleteError;
        }
      }
      
      console.log(`Successfully deleted ${packagesToDelete.length} duplicate packages from my_packages`);
    }

    console.log(`My packages deduplication completed: Removed ${packagesToDelete.length} duplicate packages`);
    console.log(`- Reseller ID duplicates: ${packagesToDelete.length - combinationDuplicates}`);
    console.log(`- Combination duplicates: ${combinationDuplicates}`);

    res.status(200).json({
      status: 'success',
      message: `Successfully removed ${packagesToDelete.length} duplicate packages from my_packages`,
      removedCount: packagesToDelete.length,
      remainingCount: finalPackagesToKeep.length,
      details: {
        resellerIdDuplicates: packagesToDelete.length - combinationDuplicates,
        combinationDuplicates: combinationDuplicates
      }
    });
  } catch (error) {
    console.error('Error deduplicating my_packages:', error);
    next(error);
  }
};

// Helper function to calculate my_package completeness score
function calculateMyPackageCompleteness(pkg: any): number {
  let score = 0;
  
  if (pkg.name) score += 2;
  if (pkg.country_name) score += 2;
  if (pkg.country_code) score += 1;
  if (pkg.data_amount) score += 2;
  if (pkg.days) score += 2;
  if (pkg.base_price) score += 1;
  if (pkg.sale_price) score += 2;
  if (pkg.reseller_id) score += 2; // Higher weight for reseller_id
  if (pkg.region) score += 1;
  if (pkg.visible !== undefined) score += 1;
  if (pkg.show_on_frontend !== undefined) score += 1;
  
  return score;
} 