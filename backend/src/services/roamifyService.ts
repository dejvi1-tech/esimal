import axios from 'axios';
import { logger } from '../utils/logger';
import { isAxiosError } from '../utils/esimUtils';

export interface RoamifyEsimData {
  id: string;
  iccid: string;
  status: string;
  esim: {
    lpaCode: string;
    smdpAddress: string;
    activationCode: string;
    qrCodeUrl: string;
    pin: string;
    puk: string;
    number: string;
    iosQuickInstall: string;
  };
  apn: {
    apnAutomatic: boolean;
    apnName: string;
    apnUsername: string;
    apnPassword: string;
  };
  data: {
    isUnlimited: boolean;
  };
  call: {
    withCall: boolean;
    callType: string;
  };
  sms: {
    withSMS: boolean;
    smsType: string;
  };
  notes: string[];
  createdAt: number;
  updatedAt: number;
  expiredAt: number;
}

export interface RoamifyApplyResponse {
  status: string;
  data: RoamifyEsimData;
}

export interface RoamifyPackage {
  packageId: string;
  // Add other package properties as needed
}

export interface RoamifyCountryPackages {
  packages: RoamifyPackage[];
  // Add other country properties as needed
}

export interface RoamifyPackagesResponse {
  data: {
    packages: RoamifyCountryPackages[];
  };
}

type RoamifyEsimResponse = {
  data?: {
    esim?: {
      qrCodeUrl?: string;
      lpaCode?: string;
      activationCode?: string;
      iosQuickInstall?: string;
    }
  }
};

type EsimApplyResponse = {
  data: {
    esim: {
      qrCodeUrl: string;
      status?: string;
      lpaCode?: string;
      activationCode?: string;
      iosQuickInstall?: string;
    };
  };
};

// New TypeScript interfaces for Roamify V2 order request
export interface RoamifyOrderItem {
  packageId: string;
  quantity: number;
}

export interface RoamifyEsimOrderRequest {
  items: RoamifyOrderItem[];
}

// New TypeScript interfaces for Roamify V2 response structure
export interface RoamifyEsimOrderItem {
  packageId: string;
  quantity: number;
  esimId: string;
}

export interface RoamifyEsimOrderResponse {
  status: string;
  data: {
    orderId: string;
    items: RoamifyEsimOrderItem[];
  }
}

export class RoamifyService {
  private static apiKey = process.env.ROAMIFY_API_KEY;
  private static baseUrl = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
  private static maxRetries = 3;
  private static retryDelay = 2000; // 2 seconds



  /**
   * Validate if a package ID exists in Roamify system
   */
  static async validatePackageId(packageId: string): Promise<boolean> {
    try {
      const response = await axios.get<RoamifyPackagesResponse>(`${this.baseUrl}/api/packages`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const countries = response.data.data?.packages || [];
      const allPackages = countries.flatMap((country: RoamifyCountryPackages) => 
        (country.packages || []).map((pkg: RoamifyPackage) => pkg.packageId)
      );

      return allPackages.includes(packageId);
    } catch (error) {
      logger.error('Error validating package ID with Roamify:', error);
      return false;
    }
  }



  /**
   * Retry wrapper for API calls
   */
  private static async retryApiCall<T>(
    apiCall: () => Promise<T>,
    operation: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: unknown) {
        const err = error as any;
        if (isAxiosError(err)) {
          console.error(err.response?.data || err.message);
          lastError = err as Error;
        } else if (err instanceof Error) {
          console.error(err.message);
          lastError = err;
        } else {
          console.error(String(err));
          lastError = new Error('Unknown error');
        }
        
        if (attempt === maxRetries) {
          logger.error(`Failed ${operation} after ${maxRetries} attempts:`, lastError.message || String(lastError));
          throw lastError;
        }

        // Don't retry on 4xx errors (client errors)
        if (isAxiosError(err) && err.response && err.response.status >= 400 && err.response.status < 500) {
          logger.error(`${operation} failed with client error (${err.response.status}):`, err.response.data);
          throw lastError;
        }

        logger.warn(`${operation} attempt ${attempt} failed, retrying in ${this.retryDelay}ms:`, lastError.message || String(lastError));
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw lastError!;
  }

  /**
   * Generate real QR code from Roamify using /api/esims endpoint
   */
  static async generateRealQRCode(esimId: string): Promise<{
    lpaCode: string;
    qrCodeUrl: string;
    activationCode: string;
    iosQuickInstall: string;
  }> {
    return this.retryApiCall(async () => {
      logger.info(`Generating real QR code for eSIM: ${esimId}`);

      const response = await axios.post<RoamifyApplyResponse>(
        `${this.baseUrl}/api/esims`,
        {
          esimId: esimId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'insomnia/10.1.1',
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error('Failed to generate QR code from Roamify');
      }

      const esimData = response.data.data;
      
      logger.info(`Real QR code generated successfully for eSIM: ${esimId}`);

      return {
        lpaCode: esimData.esim.lpaCode,
        qrCodeUrl: esimData.esim.qrCodeUrl,
        activationCode: esimData.esim.activationCode,
        iosQuickInstall: esimData.esim.iosQuickInstall,
      };
    }, `QR code generation for eSIM ${esimId}`);
  }

  /**
   * Get eSIM details from Roamify
   */
  static async getEsimDetails(esimId: string): Promise<RoamifyEsimData> {
    return this.retryApiCall(async () => {
      logger.info(`Getting eSIM details for: ${esimId}`);

      const response = await axios.get(
        `${this.baseUrl}/api/esims/${esimId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data.data;
    }, `Getting eSIM details for ${esimId}`);
  }

  /**
   * Create eSIM order with Roamify
   */
  static async createEsimOrder(packageId: string, quantity: number = 1): Promise<{
    orderId: string;
    esimId: string;
    items: any[];
  }> {
    return this.retryApiCall(async () => {
      logger.info(`Creating eSIM order with Roamify for package: ${packageId}`);

      const url = `${this.baseUrl}/api/esim/order`;
      
      const payload: RoamifyEsimOrderRequest = {
        items: [
          {
            packageId: packageId,
            quantity: quantity
          }
        ]
      };
      
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'esim-marketplace/1.0.0'
      };
      
      logger.info('[ROAMIFY DEBUG] Request Payload:', JSON.stringify(payload));
      logger.info('[ROAMIFY DEBUG] Request Headers:', JSON.stringify(headers));

      const response = await axios.post<RoamifyEsimOrderResponse>(url, payload, { headers });

      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error('Failed to create eSIM order with Roamify');
      }

      const orderData = response.data.data;
      
      // Extract eSIM ID from the V2 response structure
      const esimId = orderData.items[0]?.esimId;
      if (!esimId) {
        throw new Error(`Invalid eSIM ID received from Roamify: ${esimId}`);
      }
      
      logger.info(`eSIM order created successfully:`, {
        orderId: orderData.orderId,
        esimId: esimId,
        packageId: packageId
      });

      return {
        orderId: orderData.orderId,
        esimId: esimId,
        items: orderData.items || []
      };
    }, `Creating eSIM order for package ${packageId}`);
  }

  /**
   * Create eSIM order with Roamify (new API)
   */
  static async createEsimOrderV2({
    packageId,
    quantity = 1,
    countryName,
    region
  }: {
    packageId: string;
    quantity?: number;
    countryName?: string;
    region?: string;
  }): Promise<any> {
    // Basic validation
    if (!packageId || typeof packageId !== 'string' || packageId.trim() === '') {
      logger.error(`[ROAMIFY V2] Invalid package ID provided: ${packageId}`);
      throw new Error(`Invalid package ID: ${packageId}`);
    }

    return this.retryApiCall(async () => {
      const url = `${this.baseUrl}/api/esim/order`;
      
      const payload: RoamifyEsimOrderRequest = {
        items: [
          {
            packageId: packageId,
            quantity: quantity
          }
        ]
      };
      
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'esim-marketplace/1.0.0'
      };
      
      logger.info('[ROAMIFY V2 DEBUG] Request Payload:', JSON.stringify(payload));
      logger.info('[ROAMIFY V2 DEBUG] Request Headers:', JSON.stringify(headers));

      const response = await axios.post<RoamifyEsimOrderResponse>(url, payload, { headers });
      
      if (response.data.status !== 'success' || !response.data.data) {
        throw new Error('Failed to create eSIM order with Roamify');
      }

      const orderData = response.data.data;
      
      // Extract eSIM ID from the V2 response structure
      const esimId = orderData.items[0]?.esimId;
      if (!esimId) {
        throw new Error(`Invalid eSIM ID received from Roamify: ${esimId}`);
      }
      
      logger.info(`[ROAMIFY V2] eSIM order created successfully:`, {
        orderId: orderData.orderId,
        esimId: esimId,
        packageId: packageId
      });

      return {
        orderId: orderData.orderId,
        esimId: esimId,
        items: orderData.items || []
      };
    }, `Creating eSIM order V2 for package ${packageId}`);
  }

  /**
   * Create eSIM order using the official V2 endpoint and payload shape
   */
  static async createOrderV2(packageId: string): Promise<RoamifyEsimOrderResponse> {
    // Use the official V2 endpoint and payload shape per Roamify API docs
    const url = `${this.baseUrl}/api/esim/order`;
    const payload: RoamifyEsimOrderRequest = {
      items: [
        {
          packageId: packageId,
          quantity: 1
        }
      ]
    };
    const body = JSON.stringify(payload);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const response = await axios.post<RoamifyEsimOrderResponse>(url, body, { headers });

    return response.data;
  }

  /**
   * Check if Roamify API is healthy
   */
  static async checkApiHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health-check`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 10000, // 10 second timeout
      });
      
      return response.status === 200;
    } catch (error) {
      logger.error('Roamify API health check failed:', error);
      return false;
    }
  }

  /**
   * Generate eSIM profile/QR code
   */
  static async generateEsimProfile(esimId: string): Promise<any> {
    const url = `${this.baseUrl}/api/esims`;
    const payload = {
      esimId: esimId
    };
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    logger.info('[ROAMIFY DEBUG] Generating eSIM profile:', {
      url,
      esimId,
    });

    try {
      const response = await axios.post(url, payload, { headers });
      logger.info('[ROAMIFY DEBUG] eSIM profile generated successfully:', {
        esimId,
        status: response.status,
      });
      return response.data;
    } catch (error: any) {
      logger.error('[ROAMIFY DEBUG] Error generating eSIM profile:', {
        esimId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Poll for QR code after applying eSIM profile (5-minute timeout for email flow)
   */
  static async getQrCodeWithPolling5Min(esimId: string): Promise<{
    qrCodeUrl: string;
    lpaCode: string;
    activationCode: string;
    iosQuickInstall: string;
  }> {
    const maxWaitMs = 300000; // 5 minutes max
    const pollIntervalMs = 10000; // 10 seconds interval
    const start = Date.now();
    
    logger.info(`[ROAMIFY QR POLL] Starting 5-minute QR code polling for eSIM: ${esimId}`);
    
    // Step 1: Apply for profile
    const response = await axios.post<EsimApplyResponse>(
      `${this.baseUrl}/api/esim/apply`,
      { esimId },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    // LOG: Initial API response from /api/esim/apply
    logger.info(`[ROAMIFY QR POLL] Initial apply response for eSIM: ${esimId}`, {
      responseStatus: response.status,
      hasData: !!response.data,
      hasDataData: !!response.data?.data,
      hasEsim: !!response.data?.data?.esim,
      responseStructure: {
        data: response.data ? {
          data: response.data.data ? {
            esim: response.data.data.esim ? {
              hasLpaCode: !!response.data.data.esim.lpaCode,
              hasQrCodeUrl: !!response.data.data.esim.qrCodeUrl,
              hasActivationCode: !!response.data.data.esim.activationCode,
              lpaCodePreview: response.data.data.esim.lpaCode ? `${response.data.data.esim.lpaCode.substring(0, 30)}...` : 'none'
            } : 'no esim'
          } : 'no data.data'
        } : 'no data'
      }
    });
    
    let esim = response.data?.data?.esim;
    let qrCodeUrl = esim?.qrCodeUrl || '';
    let lpaCode = esim?.lpaCode || '';
    let activationCode = esim?.activationCode || '';
    let iosQuickInstall = esim?.iosQuickInstall || '';
    
    // If QR code is immediately available, return it
    if (qrCodeUrl && lpaCode) {
      logger.info(`[ROAMIFY QR POLL] ✅ Real QR code IMMEDIATELY available from /apply for eSIM: ${esimId}`, {
        lpaCodeLength: lpaCode.length,
        lpaCodePreview: `${lpaCode.substring(0, 50)}...`,
        qrCodeUrlLength: qrCodeUrl.length,
        hasActivationCode: !!activationCode,
        isValidLPA: lpaCode.includes('LPA:')
      });
      return {
        qrCodeUrl,
        lpaCode,
        activationCode,
        iosQuickInstall,
      };
    }
    
    // Poll until QR code is ready or timeout
    let attempts = 0;
    while (Date.now() - start < maxWaitMs) {
      attempts++;
      const elapsed = Date.now() - start;
      logger.info(`[ROAMIFY QR POLL] Attempt ${attempts}, elapsed: ${Math.round(elapsed/1000)}s / 300s`);
      
      await new Promise(r => setTimeout(r, pollIntervalMs));
      
      try {
        const statusRes = await axios.get<EsimApplyResponse>(`${this.baseUrl}/api/esim`, {
          params: { esimId },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        });
        
        esim = statusRes.data?.data?.esim;
        if (esim && esim.qrCodeUrl && esim.lpaCode) {
          qrCodeUrl = esim.qrCodeUrl;
          lpaCode = esim.lpaCode;
          activationCode = esim.activationCode || '';
          iosQuickInstall = esim.iosQuickInstall || '';
          
          logger.info(`[ROAMIFY QR POLL] ✅ Real QR code ready from /api/esim after ${attempts} attempts (${Math.round(elapsed/1000)}s) for eSIM: ${esimId}`, {
            lpaCodeLength: lpaCode.length,
            lpaCodePreview: `${lpaCode.substring(0, 50)}...`,
            qrCodeUrlLength: qrCodeUrl.length,
            hasActivationCode: !!activationCode,
            isValidLPA: lpaCode.includes('LPA:'),
            pollingAttempts: attempts,
            elapsedSeconds: Math.round(elapsed/1000),
            dataSource: 'ROAMIFY_POLLING_API'
          });
          return {
            qrCodeUrl,
            lpaCode,
            activationCode,
            iosQuickInstall,
          };
        } else {
          logger.info(`[ROAMIFY QR POLL] QR code not ready yet (attempt ${attempts})`, {
            hasEsim: !!esim,
            hasQrCodeUrl: !!esim?.qrCodeUrl,
            hasLpaCode: !!esim?.lpaCode,
            esimStructure: esim ? {
              qrCodeUrl: esim.qrCodeUrl ? 'present' : 'missing',
              lpaCode: esim.lpaCode ? `present(${esim.lpaCode.length}chars)` : 'missing',
              activationCode: esim.activationCode ? 'present' : 'missing'
            } : 'esim_object_missing'
          });
        }
      } catch (pollError) {
        logger.warn(`[ROAMIFY QR POLL] Error during polling attempt ${attempts}:`, pollError);
      }
    }
    
    logger.error(`[ROAMIFY QR POLL] ❌ Timeout after 5 minutes waiting for QR code for eSIM: ${esimId}`);
    throw new Error(`QR code not ready after 5 minutes for eSIM: ${esimId}`);
  }

  /**
   * Poll for QR code after applying eSIM profile (original method)
   */
  static async getQrCodeWithPolling(esimId: string): Promise<{
    qrCodeUrl: string;
    lpaCode: string;
    activationCode: string;
    iosQuickInstall: string;
  }> {
    // Step 1: Apply for profile
    const response = await axios.post<EsimApplyResponse>(
      `${this.baseUrl}/api/esim/apply`,
      { esimId },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    let esim = response.data?.data?.esim;
    let qrCodeUrl = esim?.qrCodeUrl || '';
    let lpaCode = esim?.lpaCode || '';
    let activationCode = esim?.activationCode || '';
    let iosQuickInstall = esim?.iosQuickInstall || '';
    let tries = 0;
    
    while (!qrCodeUrl && tries < 10) {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await axios.get<EsimApplyResponse>(`${this.baseUrl}/api/esim`, {
        params: { esimId },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });
      esim = statusRes.data?.data?.esim;
      if (esim && esim.qrCodeUrl) {
        qrCodeUrl = esim.qrCodeUrl;
        lpaCode = esim.lpaCode || '';
        activationCode = esim.activationCode || '';
        iosQuickInstall = esim.iosQuickInstall || '';
      } else {
        logger.error('QR code not found in response while polling', { tries, esimId, response: statusRes.data });
      }
      tries++;
      logger.info(`[ROAMIFY POLL] Poll attempt ${tries}: qrCodeUrl=${qrCodeUrl ? 'READY' : 'pending'}`);
    }
    if (!qrCodeUrl) {
      throw new Error('QR code not ready after multiple attempts');
    }
    return {
      qrCodeUrl,
      lpaCode,
      activationCode,
      iosQuickInstall,
    };
  }

  /**
   * Poll Roamify for eSIM profile until activationCode and smDp+Address are available
   */
  static async getEsimProfileWithPolling(orderId: string): Promise<{ activationCode: string, smDpPlusAddress: string, lpaCode: string }> {
    const maxWaitMs = 300000; // 5 minutes max
    const pollIntervalMs = 5000; // 5 seconds
    const start = Date.now();
    let lastError = null;
    while (Date.now() - start < maxWaitMs) {
      try {
        const response = await axios.get(`${this.baseUrl}/api/esim/order/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'esim-marketplace/1.0.0',
          },
          timeout: 15000,
        });
        const data = response.data?.data;
        const esim = data?.esim;
        const activationCode = esim?.activationCode || esim?.activation_code;
        const smDpPlusAddress = esim?.smdpAddress || esim?.smDpPlusAddress;
        const lpaCode = esim?.lpaCode;
        if (activationCode && smDpPlusAddress) {
          logger.info(`[ROAMIFY] Got eSIM profile: activationCode=${activationCode}, smDpPlusAddress=${smDpPlusAddress}, lpaCode=${lpaCode}`);
          return { activationCode, smDpPlusAddress, lpaCode };
        }
        logger.info(`[ROAMIFY] eSIM profile not ready yet for order ${orderId}. Retrying...`);
      } catch (err) {
        lastError = err;
        logger.warn(`[ROAMIFY] Error polling eSIM profile for order ${orderId}: ${err}`);
      }
      await new Promise(res => setTimeout(res, pollIntervalMs));
    }
    logger.error(`[ROAMIFY] Timed out waiting for eSIM profile for order ${orderId}`);
    throw lastError || new Error('Timed out waiting for eSIM profile');
  }

  /**
   * Get eSIM ICCID using UUID
   * This method tries multiple approaches to get the ICCID from the UUID
   */
  static async getEsimIccid(esimUuid: string): Promise<{ iccid: string; status: string; esimData: any }> {
    return this.retryApiCall(async () => {
      logger.info(`🔍 [ICCID SERVICE] Getting eSIM ICCID for UUID: ${esimUuid}`);

      // Try multiple approaches to get ICCID
      let esimData = null;
      let iccid = null;

      // Approach 1: Try /api/esim with UUID as esimId parameter
      try {
        logger.info(`🔍 [ICCID SERVICE] Trying /api/esim with esimId parameter for UUID: ${esimUuid}`);
        const response = await axios.get(`${this.baseUrl}/api/esim`, {
          params: { esimId: esimUuid },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'esim-marketplace/1.0.0'
          }
        });
        
        logger.info(`🔍 [ICCID SERVICE] /api/esim response:`, response.data);
        
        if (response.data && response.data.iccid && response.data.iccid.startsWith('89')) {
          iccid = response.data.iccid;
          esimData = response.data;
          logger.info(`✅ [ICCID SERVICE] Success via /api/esim: ${iccid}`);
        } else if (response.data && response.data.data && response.data.data.iccid && response.data.data.iccid.startsWith('89')) {
          iccid = response.data.data.iccid;
          esimData = response.data.data;
          logger.info(`✅ [ICCID SERVICE] Success via /api/esim (nested data): ${iccid}`);
        } else {
          logger.warn(`⚠️ [ICCID SERVICE] /api/esim returned invalid ICCID: ${response.data?.iccid || response.data?.data?.iccid}`);
        }
      } catch (error) {
        logger.warn(`❌ [ICCID SERVICE] /api/esim failed: ${error}`);
      }

      // Approach 2: Try /api/esim/order with UUID as esimId parameter
      if (!iccid) {
        try {
          logger.info(`[ICCID] Trying /api/esim/order with esimId parameter for UUID: ${esimUuid}`);
          const response = await axios.get(`${this.baseUrl}/api/esim/order`, {
            params: { esimId: esimUuid },
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'esim-marketplace/1.0.0'
            }
          });
          
          logger.info(`[ICCID] /api/esim/order response:`, response.data);
          
          if (response.data && response.data.iccid && response.data.iccid.startsWith('89')) {
            iccid = response.data.iccid;
            esimData = response.data;
            logger.info(`[ICCID] Success via /api/esim/order: ${iccid}`);
          } else if (response.data && response.data.data && response.data.data.iccid && response.data.data.iccid.startsWith('89')) {
            iccid = response.data.data.iccid;
            esimData = response.data.data;
            logger.info(`[ICCID] Success via /api/esim/order (nested data): ${iccid}`);
          }
        } catch (error) {
          logger.warn(`[ICCID] /api/esim/order failed: ${error}`);
        }
      }

      // Approach 3: Try /api/esim/details with UUID as parameter
      if (!iccid) {
        try {
          logger.info(`[ICCID] Trying /api/esim/details for UUID: ${esimUuid}`);
          const response = await axios.get(`${this.baseUrl}/api/esim/details`, {
            params: { esimId: esimUuid },
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'esim-marketplace/1.0.0'
            }
          });
          
          logger.info(`[ICCID] /api/esim/details response:`, response.data);
          
          if (response.data && response.data.iccid && response.data.iccid.startsWith('89')) {
            iccid = response.data.iccid;
            esimData = response.data;
            logger.info(`[ICCID] Success via /api/esim/details: ${iccid}`);
          } else if (response.data && response.data.data && response.data.data.iccid && response.data.data.iccid.startsWith('89')) {
            iccid = response.data.data.iccid;
            esimData = response.data.data;
            logger.info(`[ICCID] Success via /api/esim/details (nested data): ${iccid}`);
          }
        } catch (error) {
          logger.warn(`[ICCID] /api/esim/details failed: ${error}`);
        }
      }

      // Approach 4: Try the existing getEsimDetails method as fallback
      if (!iccid) {
        try {
          logger.info(`🔍 [ICCID SERVICE] Trying getEsimDetails for UUID: ${esimUuid}`);
          esimData = await this.getEsimDetails(esimUuid);
          logger.info(`🔍 [ICCID SERVICE] getEsimDetails response:`, esimData);
          
          if (esimData.iccid && esimData.iccid.startsWith('89')) {
            iccid = esimData.iccid;
            logger.info(`✅ [ICCID SERVICE] Success via getEsimDetails: ${iccid}`);
          } else {
            logger.warn(`⚠️ [ICCID SERVICE] getEsimDetails returned invalid ICCID: ${esimData.iccid}`);
          }
        } catch (error) {
          logger.warn(`❌ [ICCID SERVICE] getEsimDetails failed: ${error}`);
        }
      }

      if (!iccid) {
        throw new Error(`Failed to retrieve ICCID for eSIM UUID: ${esimUuid} after trying all approaches`);
      }

      logger.info(`ICCID retrieved successfully: ${iccid}`);

      return {
        iccid: iccid,
        status: esimData?.status || 'unknown',
        esimData: esimData
      };
    }, `Getting eSIM ICCID for ${esimUuid}`);
  }

  /**
   * Get eSIM usage details using ICCID
   * This method uses the correct Roamify API endpoint: /api/esim/usage/details
   */
  static async getEsimUsageDetails(iccid: string): Promise<{
    dataUsed: number;
    dataLimit: number;
    dataRemaining: number;
    status: string;
    lastUpdated: string;
  }> {
    return this.retryApiCall(async () => {
      logger.info(`Getting eSIM usage details for ICCID: ${iccid}`);

      // Use the correct endpoint from Roamify API docs
      const url = `${this.baseUrl}/api/esim/usage/details`;
      
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'esim-marketplace/1.0.0'
      };
      
      const params = { iccid: iccid };
      
      logger.info('[ROAMIFY DEBUG] Getting usage details - URL:', url);
      logger.info('[ROAMIFY DEBUG] Getting usage details - Params:', JSON.stringify(params));

      const response = await axios.get(url, { headers, params });

      if (!response.data) {
        throw new Error(`Failed to get usage details for ICCID: ${iccid}`);
      }

      const usageData = response.data;
      
      logger.info(`eSIM usage details retrieved successfully:`, {
        iccid: iccid,
        dataUsed: usageData.dataUsed,
        dataLimit: usageData.dataLimit,
        dataRemaining: usageData.dataRemaining,
        status: usageData.status
      });

      return {
        dataUsed: usageData.dataUsed || 0,
        dataLimit: usageData.dataLimit || 0,
        dataRemaining: usageData.dataRemaining || 0,
        status: usageData.status || 'unknown',
        lastUpdated: new Date().toISOString()
      };
    }, `Getting usage details for ICCID ${iccid}`);
  }
} 