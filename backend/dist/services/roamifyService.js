"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoamifyService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const esimUtils_1 = require("../utils/esimUtils");
class RoamifyService {
    /**
     * Retry wrapper for API calls
     */
    static async retryApiCall(apiCall, operation, maxRetries = this.maxRetries) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await apiCall();
            }
            catch (error) {
                const err = error;
                if ((0, esimUtils_1.isAxiosError)(err)) {
                    console.error(err.response?.data || err.message);
                    lastError = err;
                }
                else if (err instanceof Error) {
                    console.error(err.message);
                    lastError = err;
                }
                else {
                    console.error(String(err));
                    lastError = new Error('Unknown error');
                }
                if (attempt === maxRetries) {
                    logger_1.logger.error(`Failed ${operation} after ${maxRetries} attempts:`, lastError.message || String(lastError));
                    throw lastError;
                }
                // Don't retry on 4xx errors (client errors)
                if ((0, esimUtils_1.isAxiosError)(err) && err.response && err.response.status >= 400 && err.response.status < 500) {
                    logger_1.logger.error(`${operation} failed with client error (${err.response.status}):`, err.response.data);
                    throw lastError;
                }
                logger_1.logger.warn(`${operation} attempt ${attempt} failed, retrying in ${this.retryDelay}ms:`, lastError.message || String(lastError));
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
        throw lastError;
    }
    /**
     * Generate real QR code from Roamify using /api/esim/apply endpoint
     */
    static async generateRealQRCode(esimId) {
        return this.retryApiCall(async () => {
            logger_1.logger.info(`Generating real QR code for eSIM: ${esimId}`);
            const response = await axios_1.default.post(`${this.baseUrl}/api/esim/apply`, {
                esimId: esimId
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'User-Agent': 'insomnia/10.1.1',
                    'Content-Type': 'application/json',
                },
                timeout: 30000, // 30 second timeout
            });
            if (response.data.status !== 'success' || !response.data.data) {
                throw new Error('Failed to generate QR code from Roamify');
            }
            const esimData = response.data.data;
            logger_1.logger.info(`Real QR code generated successfully for eSIM: ${esimId}`);
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
    static async getEsimDetails(esimId) {
        return this.retryApiCall(async () => {
            logger_1.logger.info(`Getting eSIM details for: ${esimId}`);
            const response = await axios_1.default.get(`${this.baseUrl}/api/esim`, {
                params: {
                    iccid: esimId
                },
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'User-Agent': 'insomnia/10.1.1',
                    'Content-Type': 'application/json',
                },
                timeout: 15000, // 15 second timeout
            });
            return response.data;
        }, `eSIM details fetch for ${esimId}`);
    }
    /**
     * Create eSIM order with Roamify
     */
    static async createEsimOrder(packageId, quantity = 1) {
        return this.retryApiCall(async () => {
            logger_1.logger.info(`Creating eSIM order with Roamify for package: ${packageId}`);
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
            logger_1.logger.info('[ROAMIFY DEBUG] Request URL:', url);
            logger_1.logger.info('[ROAMIFY DEBUG] Request Payload:', JSON.stringify(payload));
            logger_1.logger.info('[ROAMIFY DEBUG] Request Headers:', JSON.stringify(headers));
            try {
                const response = await axios_1.default.post(url, payload, {
                    headers,
                    timeout: 30000, // 30 second timeout
                });
                logger_1.logger.info('[ROAMIFY DEBUG] Response Status:', response.status);
                logger_1.logger.info('[ROAMIFY DEBUG] Response Headers:', JSON.stringify(response.headers));
                logger_1.logger.info('[ROAMIFY DEBUG] Response Data:', JSON.stringify(response.data));
                const data = response.data;
                if (!data || !data.data) {
                    throw new Error('No response from Roamify API');
                }
                const result = data.data;
                const esimItem = result.items && result.items[0];
                const esimId = esimItem?.esimId || esimItem?.iccid || esimItem?.esim_code || esimItem?.code;
                if (!esimId) {
                    throw new Error('No eSIM ID received from Roamify API');
                }
                logger_1.logger.info(`eSIM order created successfully. Order ID: ${result.id}, eSIM ID: ${esimId}`);
                return {
                    orderId: result.id || result.orderId,
                    esimId: esimId,
                    items: result.items || []
                };
            }
            catch (error) {
                if (error.response) {
                    logger_1.logger.error('[ROAMIFY DEBUG] Error Response Status:', error.response.status);
                    logger_1.logger.error('[ROAMIFY DEBUG] Error Response Headers:', JSON.stringify(error.response.headers));
                    logger_1.logger.error('[ROAMIFY DEBUG] Error Response Data:', JSON.stringify(error.response.data));
                }
                else {
                    logger_1.logger.error('[ROAMIFY DEBUG] Error:', error.message);
                }
                throw error;
            }
        }, `eSIM order creation for package ${packageId}`);
    }
    /**
     * Create eSIM order with Roamify (new API)
     */
    static async createEsimOrderV2({ packageId, email, phoneNumber, firstName, lastName, quantity = 1 }) {
        const url = `${this.baseUrl}/api/esim/order`;
        const payload = {
            items: [
                {
                    packageId: packageId,
                    quantity: quantity
                }
            ],
            customer: {
                email,
                phoneNumber,
                firstName,
                lastName
            }
        };
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };
        logger_1.logger.info('[ROAMIFY V2 DEBUG] Request URL:', url);
        logger_1.logger.info('[ROAMIFY V2 DEBUG] Request Payload:', JSON.stringify(payload));
        logger_1.logger.info('[ROAMIFY V2 DEBUG] Request Headers:', JSON.stringify(headers));
        try {
            const response = await axios_1.default.post(url, payload, { headers, timeout: 30000 });
            logger_1.logger.info('[ROAMIFY V2 DEBUG] Response Status:', response.status);
            logger_1.logger.info('[ROAMIFY V2 DEBUG] Response Headers:', JSON.stringify(response.headers));
            logger_1.logger.info('[ROAMIFY V2 DEBUG] Response Data:', JSON.stringify(response.data));
            return response.data;
        }
        catch (error) {
            if (error.response) {
                logger_1.logger.error('[ROAMIFY V2 DEBUG] Error Response Status:', error.response.status);
                logger_1.logger.error('[ROAMIFY V2 DEBUG] Error Response Headers:', JSON.stringify(error.response.headers));
                logger_1.logger.error('[ROAMIFY V2 DEBUG] Error Response Data:', JSON.stringify(error.response.data));
            }
            else {
                logger_1.logger.error('[ROAMIFY V2 DEBUG] Error:', error.message);
            }
            throw error;
        }
    }
    /**
     * Check if Roamify API is healthy
     */
    static async checkApiHealth() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/health`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                timeout: 10000, // 10 second timeout
            });
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Roamify API health check failed:', error);
            return false;
        }
    }
}
exports.RoamifyService = RoamifyService;
RoamifyService.apiKey = process.env.ROAMIFY_API_KEY;
RoamifyService.baseUrl = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
RoamifyService.maxRetries = 3;
RoamifyService.retryDelay = 2000; // 2 seconds
//# sourceMappingURL=roamifyService.js.map