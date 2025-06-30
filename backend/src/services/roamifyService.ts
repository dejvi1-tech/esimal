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

export class RoamifyService {
  private static apiKey = process.env.ROAMIFY_API_KEY;
  private static baseUrl = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
  private static maxRetries = 3;
  private static retryDelay = 2000; // 2 seconds

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
   * Generate real QR code from Roamify using /api/esim/apply endpoint
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
        `${this.baseUrl}/api/esim/apply`,
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
        `${this.baseUrl}/api/esim`,
        {
          params: {
            iccid: esimId
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'insomnia/10.1.1',
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout
        }
      );

      return response.data as RoamifyEsimData;
    }, `eSIM details fetch for ${esimId}`);
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
      const payload = {
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
      try {
        logger.info(`[ROAMIFY DEBUG] Trying endpoint: ${url}`);
        const response = await axios.post(
          url,
          payload,
          {
            headers,
            timeout: 30000, // 30 second timeout
          }
        );
        logger.info('[ROAMIFY DEBUG] Response Status:', response.status);
        logger.info('[ROAMIFY DEBUG] Response Headers:', JSON.stringify(response.headers));
        logger.info('[ROAMIFY DEBUG] Response Data:', JSON.stringify(response.data));
        const data = response.data as { data?: any; orderId?: string; esimId?: string; items?: any[] };
        let result: any;
        if (data.data) {
          result = data.data;
        } else if (data.orderId || data.esimId) {
          result = data;
        } else {
          result = data;
        }
        const esimItem = result.items && result.items[0];
        const esimId = esimItem?.esimId || esimItem?.iccid || esimItem?.esim_code || esimItem?.code;
        if (!esimId) {
          throw new Error('No eSIM ID received from Roamify API');
        }
        const orderId = result.id || result.orderId;
        logger.info(`eSIM order created successfully. Order ID: ${orderId}, eSIM ID: ${esimId}`);
        return {
          orderId: orderId,
          esimId: esimId,
          items: result.items || []
        };
      } catch (error: any) {
        if (error.response) {
          logger.error(`[ROAMIFY DEBUG] Error with endpoint ${url}:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          });
          
          // If it's a 500 error, try with a known working package ID as fallback
          if (error.response.status === 500) {
            logger.error(`[ROAMIFY DEBUG] 500 error detected for package ${packageId}`);
            throw error;
          }
        } else {
          logger.error(`[ROAMIFY DEBUG] Network error with endpoint ${url}:`, error.message);
        }
        throw error;
      }
    }, `eSIM order creation for package ${packageId}`);
  }

  /**
   * Create eSIM order with Roamify (new API)
   */
  static async createEsimOrderV2({
    packageId,
    quantity = 1
  }: {
    packageId: string;
    quantity?: number;
  }): Promise<any> {
    return this.retryApiCall(async () => {
      const url = `${this.baseUrl}/api/esim/order`;
      const payload = {
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
      try {
        logger.info(`[ROAMIFY V2 DEBUG] Trying endpoint: ${url}`);
        const response = await axios.post(url, payload, { headers, timeout: 30000 });
        logger.info('[ROAMIFY V2 DEBUG] Response Status:', response.status);
        logger.info('[ROAMIFY V2 DEBUG] Response Headers:', JSON.stringify(response.headers));
        logger.info('[ROAMIFY V2 DEBUG] Response Data:', JSON.stringify(response.data));
        const data = response.data as { data?: any; orderId?: string; esimId?: string; items?: any[] };
        let result: any;
        if (data.data) {
          result = data.data;
        } else if (data.orderId || data.esimId) {
          result = data;
        } else {
          result = data;
        }
        const esimItem = result.items && result.items[0];
        const esimId = esimItem?.esimId || esimItem?.iccid || esimItem?.esim_code || esimItem?.code;
        if (!esimId) {
          throw new Error('No eSIM ID received from Roamify API');
        }
        const orderId = result.id || result.orderId;
        logger.info(`eSIM order created successfully. Order ID: ${orderId}, eSIM ID: ${esimId}`);
        return {
          orderId: orderId,
          esimId: esimId,
          items: result.items || []
        };
      } catch (error: any) {
        if (error.response) {
          logger.error(`[ROAMIFY V2 DEBUG] Error with endpoint ${url}:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers
          });
          
          // If it's a 500 error, try with a known working package ID as fallback
          if (error.response.status === 500) {
            logger.error(`[ROAMIFY V2 DEBUG] 500 error detected for package ${packageId}`);
            throw error;
          }
        } else {
          logger.error(`[ROAMIFY V2 DEBUG] Network error with endpoint ${url}:`, error.message);
        }
        throw error;
      }
    }, `eSIM order creation for package ${packageId}`);
  }

  /**
   * Check if Roamify API is healthy
   */
  static async checkApiHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
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
    const url = `${this.baseUrl}/api/esim/apply`;
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
   * Poll for QR code after applying eSIM profile
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
} 