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
      };
      logger.info('[ROAMIFY DEBUG] Request URL:', url);
      logger.info('[ROAMIFY DEBUG] Request Payload:', JSON.stringify(payload));
      logger.info('[ROAMIFY DEBUG] Request Headers:', JSON.stringify(headers));

      try {
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

        const data = response.data as { data?: any };
        if (!data || !data.data) {
          throw new Error('No response from Roamify API');
        }
        const result = data.data;
        const esimItem = result.items && result.items[0];
        const esimId = esimItem?.esimId || esimItem?.iccid || esimItem?.esim_code || esimItem?.code;
        if (!esimId) {
          throw new Error('No eSIM ID received from Roamify API');
        }
        logger.info(`eSIM order created successfully. Order ID: ${result.id}, eSIM ID: ${esimId}`);

        return {
          orderId: result.id || result.orderId,
          esimId: esimId,
          items: result.items || []
        };
      } catch (error: any) {
        if (error.response) {
          logger.error('[ROAMIFY DEBUG] Error Response Status:', error.response.status);
          logger.error('[ROAMIFY DEBUG] Error Response Headers:', JSON.stringify(error.response.headers));
          logger.error('[ROAMIFY DEBUG] Error Response Data:', JSON.stringify(error.response.data));
        } else {
          logger.error('[ROAMIFY DEBUG] Error:', error.message);
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
    email,
    phoneNumber,
    firstName,
    lastName,
    quantity = 1
  }: {
    packageId: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    quantity?: number;
  }): Promise<any> {
    const url = 'https://api.roamify.com/create-esim-order';
    const payload = {
      packageId,
      email,
      phoneNumber,
      firstName,
      lastName,
      quantity
    };
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    logger.info('[ROAMIFY V2 DEBUG] Request URL:', url);
    logger.info('[ROAMIFY V2 DEBUG] Request Payload:', JSON.stringify(payload));
    logger.info('[ROAMIFY V2 DEBUG] Request Headers:', JSON.stringify(headers));
    try {
      const response = await axios.post(url, payload, { headers, timeout: 30000 });
      logger.info('[ROAMIFY V2 DEBUG] Response Status:', response.status);
      logger.info('[ROAMIFY V2 DEBUG] Response Headers:', JSON.stringify(response.headers));
      logger.info('[ROAMIFY V2 DEBUG] Response Data:', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      if (error.response) {
        logger.error('[ROAMIFY V2 DEBUG] Error Response Status:', error.response.status);
        logger.error('[ROAMIFY V2 DEBUG] Error Response Headers:', JSON.stringify(error.response.headers));
        logger.error('[ROAMIFY V2 DEBUG] Error Response Data:', JSON.stringify(error.response.data));
      } else {
        logger.error('[ROAMIFY V2 DEBUG] Error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get available packages from Roamify
   */
  static async getPackages(): Promise<any[]> {
    return this.retryApiCall(async () => {
      logger.info('Fetching available packages from Roamify');

      const response = await axios.get(`${this.baseUrl}/api/packages`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 second timeout
      });

      const packages = response.data.data || [];
      logger.info(`Fetched ${packages.length} packages from Roamify`);
      
      return packages;
    }, 'packages fetch');
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
} 