import { Router } from 'express';
import { RoamifyService } from '../services/roamifyService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Test Roamify Germany 1GB 30 days package order
 */
router.get('/test-roamify-germany', async (req, res) => {
  try {
    logger.info('🧪 Testing Roamify Germany package order...');

    // Step 1: Test the old API first (what your current code uses)
    logger.info('📦 Step 1: Testing old API /api/esim/order...');
    
    // We'll use a test package ID - you'll need to replace this with a real one
    const testPackageId = 'germany-1gb-30days'; // Replace with actual package ID from your Roamify account
    
    try {
      const oldApiResult = await RoamifyService.createEsimOrder(testPackageId, 1);
      logger.info('✅ Old API test successful:', oldApiResult);
      
      // Test QR code generation
      if (oldApiResult.esimId) {
        const qrResult = await RoamifyService.generateRealQRCode(oldApiResult.esimId);
        logger.info('✅ QR code generation successful:', {
          hasLpaCode: !!qrResult.lpaCode,
          hasQrCodeUrl: !!qrResult.qrCodeUrl,
          hasActivationCode: !!qrResult.activationCode,
          hasIosQuickInstall: !!qrResult.iosQuickInstall,
        });
      }
      
      return res.json({
        success: true,
        message: 'Old API test successful',
        oldApiResult,
        recommendation: 'Your current code should work with the old API'
      });
      
    } catch (oldApiError) {
      logger.error('❌ Old API test failed:', oldApiError);
      
      // Step 2: Test the new API
      logger.info('🔄 Step 2: Testing new API /create-esim-order...');
      
      try {
        const newApiResult = await RoamifyService.createEsimOrderV2({
          packageId: testPackageId,
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          firstName: 'Test',
          lastName: 'User',
          quantity: 1
        });
        
        logger.info('✅ New API test successful:', newApiResult);
        
        return res.json({
          success: true,
          message: 'New API test successful',
          newApiResult,
          recommendation: 'Update your code to use the new API'
        });
        
      } catch (newApiError) {
        logger.error('❌ New API test also failed:', newApiError);
        
        return res.status(500).json({
          success: false,
          message: 'Both APIs failed',
          oldApiError: oldApiError.message,
          newApiError: newApiError.message,
          recommendation: 'Check your Roamify API key and package IDs'
        });
      }
    }
    
  } catch (error) {
    logger.error('❌ Test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

/**
 * Get available packages from Roamify
 */
router.get('/roamify-packages', async (req, res) => {
  try {
    logger.info('📦 Fetching Roamify packages...');
    
    const packages = await RoamifyService.getPackages();
    
    // Find Germany packages
    const germanyPackages = packages.filter(pkg => 
      pkg.name?.toLowerCase().includes('germany')
    );
    
    res.json({
      success: true,
      message: `Found ${packages.length} total packages, ${germanyPackages.length} Germany packages`,
      totalPackages: packages.length,
      germanyPackages: germanyPackages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        data_amount: pkg.data_amount,
        validity_days: pkg.validity_days,
        price: pkg.price
      })),
      allPackages: packages.slice(0, 20).map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        data_amount: pkg.data_amount,
        validity_days: pkg.validity_days,
        price: pkg.price
      }))
    });
    
  } catch (error) {
    logger.error('❌ Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
});

/**
 * Test Roamify order with a specific package ID
 */
router.get('/test-roamify-order/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    logger.info(`🧪 Testing Roamify order with package ID: ${packageId}`);

    // Test the old API first
    try {
      const oldApiResult = await RoamifyService.createEsimOrder(packageId, 1);
      logger.info('✅ Old API test successful:', oldApiResult);
      
      // Test QR code generation
      if (oldApiResult.esimId) {
        const qrResult = await RoamifyService.generateRealQRCode(oldApiResult.esimId);
        logger.info('✅ QR code generation successful:', {
          hasLpaCode: !!qrResult.lpaCode,
          hasQrCodeUrl: !!qrResult.qrCodeUrl,
          hasActivationCode: !!qrResult.activationCode,
          hasIosQuickInstall: !!qrResult.iosQuickInstall,
        });
        
        return res.json({
          success: true,
          message: 'Old API test successful',
          oldApiResult,
          qrResult,
          recommendation: 'Your current code should work with the old API'
        });
      }
      
    } catch (oldApiError) {
      logger.error('❌ Old API test failed:', oldApiError);
      
      // Test the new API
      try {
        const newApiResult = await RoamifyService.createEsimOrderV2({
          packageId: packageId,
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          firstName: 'Test',
          lastName: 'User',
          quantity: 1
        });
        
        logger.info('✅ New API test successful:', newApiResult);
        
        return res.json({
          success: true,
          message: 'New API test successful',
          newApiResult,
          recommendation: 'Update your code to use the new API'
        });
        
      } catch (newApiError) {
        logger.error('❌ New API test also failed:', newApiError);
        
        return res.status(500).json({
          success: false,
          message: 'Both APIs failed',
          oldApiError: oldApiError.message,
          newApiError: newApiError.message,
          recommendation: 'Check your Roamify API key and package IDs'
        });
      }
    }
    
  } catch (error) {
    logger.error('❌ Test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

export default router; 