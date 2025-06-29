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
            // Try both endpoints - some APIs use singular, others use plural
            const endpoints = [
                `${this.baseUrl}/api/esim/orders`, // Try plural first (more common)
                `${this.baseUrl}/api/esim/order` // Fallback to singular
            ];
            const payload = {
                packageId: packageId,
                quantity: quantity,
                email: 'customer@example.com', // Required by some APIs
                name: 'Customer',
                surname: 'User'
            };
            const headers = {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'esim-marketplace/1.0.0'
            };
            logger_1.logger.info('[ROAMIFY DEBUG] Request Payload:', JSON.stringify(payload));
            logger_1.logger.info('[ROAMIFY DEBUG] Request Headers:', JSON.stringify(headers));
            let lastError;
            for (const url of endpoints) {
                try {
                    logger_1.logger.info(`[ROAMIFY DEBUG] Trying endpoint: ${url}`);
                    const response = await axios_1.default.post(url, payload, {
                        headers,
                        timeout: 30000, // 30 second timeout
                    });
                    logger_1.logger.info('[ROAMIFY DEBUG] Response Status:', response.status);
                    logger_1.logger.info('[ROAMIFY DEBUG] Response Headers:', JSON.stringify(response.headers));
                    logger_1.logger.info('[ROAMIFY DEBUG] Response Data:', JSON.stringify(response.data));
                    const data = response.data;
                    // Handle different response formats
                    let result;
                    if (data.data) {
                        result = data.data;
                    }
                    else if (data.orderId || data.esimId) {
                        result = data;
                    }
                    else {
                        result = data;
                    }
                    // Extract eSIM ID from various possible fields
                    const esimId = result.esimId || result.iccid || result.esim_code || result.code || result.id;
                    if (!esimId) {
                        throw new Error('No eSIM ID received from Roamify API');
                    }
                    const orderId = result.orderId || result.id || result.order_id;
                    logger_1.logger.info(`eSIM order created successfully. Order ID: ${orderId}, eSIM ID: ${esimId}`);
                    return {
                        orderId: orderId,
                        esimId: esimId,
                        items: result.items || []
                    };
                }
                catch (error) {
                    lastError = error;
                    if (error.response) {
                        logger_1.logger.error(`[ROAMIFY DEBUG] Error with endpoint ${url}:`, {
                            status: error.response.status,
                            statusText: error.response.statusText,
                            data: error.response.data,
                            headers: error.response.headers
                        });
                    }
                    else {
                        logger_1.logger.error(`[ROAMIFY DEBUG] Network error with endpoint ${url}:`, error.message);
                    }
                    // If this is a 404, try the next endpoint
                    if (error.response?.status === 404) {
                        logger_1.logger.info(`[ROAMIFY DEBUG] Endpoint ${url} returned 404, trying next endpoint...`);
                        continue;
                    }
                    // For other errors, throw immediately
                    throw error;
                }
            }
            // If we get here, all endpoints failed
            throw lastError || new Error('All Roamify API endpoints failed');
        }, `eSIM order creation for package ${packageId}`);
    }
    /**
     * Create eSIM order with Roamify (new API)
     */
    static async createEsimOrderV2({ packageId, email, phoneNumber, firstName, lastName, quantity = 1 }) {
        return this.retryApiCall(async () => {
            // Try both endpoints - some APIs use singular, others use plural
            const endpoints = [
                `${this.baseUrl}/api/esim/orders`, // Try plural first (more common)
                `${this.baseUrl}/api/esim/order` // Fallback to singular
            ];
            const payload = {
                packageId: packageId,
                quantity: quantity,
                email: email,
                name: firstName,
                surname: lastName,
                phone: phoneNumber
            };
            const headers = {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'esim-marketplace/1.0.0'
            };
            logger_1.logger.info('[ROAMIFY V2 DEBUG] Request Payload:', JSON.stringify(payload));
            logger_1.logger.info('[ROAMIFY V2 DEBUG] Request Headers:', JSON.stringify(headers));
            let lastError;
            for (const url of endpoints) {
                try {
                    logger_1.logger.info(`[ROAMIFY V2 DEBUG] Trying endpoint: ${url}`);
                    const response = await axios_1.default.post(url, payload, {
                        headers,
                        timeout: 30000
                    });
                    logger_1.logger.info('[ROAMIFY V2 DEBUG] Response Status:', response.status);
                    logger_1.logger.info('[ROAMIFY V2 DEBUG] Response Headers:', JSON.stringify(response.headers));
                    logger_1.logger.info('[ROAMIFY V2 DEBUG] Response Data:', JSON.stringify(response.data));
                    const data = response.data;
                    // Handle different response formats
                    let result;
                    if (data.data) {
                        result = data.data;
                    }
                    else if (data.orderId || data.esimId) {
                        result = data;
                    }
                    else {
                        result = data;
                    }
                    // Extract eSIM ID from various possible fields
                    const esimId = result.esimId || result.iccid || result.esim_code || result.code || result.id;
                    if (!esimId) {
                        throw new Error('No eSIM ID received from Roamify API');
                    }
                    const orderId = result.orderId || result.id || result.order_id;
                    logger_1.logger.info(`eSIM order created successfully. Order ID: ${orderId}, eSIM ID: ${esimId}`);
                    return {
                        orderId: orderId,
                        esimId: esimId,
                        items: result.items || []
                    };
                }
                catch (error) {
                    lastError = error;
                    if (error.response) {
                        logger_1.logger.error(`[ROAMIFY V2 DEBUG] Error with endpoint ${url}:`, {
                            status: error.response.status,
                            statusText: error.response.statusText,
                            data: error.response.data,
                            headers: error.response.headers
                        });
                    }
                    else {
                        logger_1.logger.error(`[ROAMIFY V2 DEBUG] Network error with endpoint ${url}:`, error.message);
                    }
                    // If this is a 404, try the next endpoint
                    if (error.response?.status === 404) {
                        logger_1.logger.info(`[ROAMIFY V2 DEBUG] Endpoint ${url} returned 404, trying next endpoint...`);
                        continue;
                    }
                    // For other errors, throw immediately
                    throw error;
                }
            }
            // If we get here, all endpoints failed
            throw lastError || new Error('All Roamify API endpoints failed');
        }, `eSIM order creation for package ${packageId}`);
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
    /**
     * Generate eSIM profile/QR code
     */
    static async generateEsimProfile(esimId) {
        const url = `${this.baseUrl}/api/esim/apply`;
        const payload = {
            esimId: esimId
        };
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };
        logger_1.logger.info('[ROAMIFY DEBUG] Generating eSIM profile:', {
            url,
            esimId,
        });
        try {
            const response = await axios_1.default.post(url, payload, { headers });
            logger_1.logger.info('[ROAMIFY DEBUG] eSIM profile generated successfully:', {
                esimId,
                status: response.status,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('[ROAMIFY DEBUG] Error generating eSIM profile:', {
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
    static async getQrCodeWithPolling(esimId) {
        // Step 1: Apply for profile
        const response = await axios_1.default.post(`${this.baseUrl}/api/esim/apply`, { esimId }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
        let esim = response.data?.data?.esim;
        let qrCodeUrl = esim?.qrCodeUrl || '';
        let lpaCode = esim?.lpaCode || '';
        let activationCode = esim?.activationCode || '';
        let iosQuickInstall = esim?.iosQuickInstall || '';
        let tries = 0;
        while (!qrCodeUrl && tries < 10) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await axios_1.default.get(`${this.baseUrl}/api/esim`, {
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
            }
            else {
                logger_1.logger.error('QR code not found in response while polling', { tries, esimId, response: statusRes.data });
            }
            tries++;
            logger_1.logger.info(`[ROAMIFY POLL] Poll attempt ${tries}: qrCodeUrl=${qrCodeUrl ? 'READY' : 'pending'}`);
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
exports.RoamifyService = RoamifyService;
RoamifyService.apiKey = process.env.ROAMIFY_API_KEY;
RoamifyService.baseUrl = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
RoamifyService.maxRetries = 3;
RoamifyService.retryDelay = 2000; // 2 seconds
//# sourceMappingURL=roamifyService.js.map