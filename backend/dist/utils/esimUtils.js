"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCodeData = exports.validateEsimCode = exports.generateEsimCode = void 0;
exports.isAxiosError = isAxiosError;
exports.parseValidityToDays = parseValidityToDays;
const supabase_1 = require("../config/supabase");
const logger_1 = require("./logger");
/**
 * Generates a unique eSIM activation code
 * Format: ESIM-XXXX-XXXX-XXXX where X is alphanumeric
 */
const generateEsimCode = async () => {
    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const segments = 3;
        const segmentLength = 4;
        const code = Array(segments)
            .fill(null)
            .map(() => Array(segmentLength)
            .fill(null)
            .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
            .join(''))
            .join('-');
        return `ESIM-${code}`;
    };
    // Try to generate a unique code (max 5 attempts)
    for (let i = 0; i < 5; i++) {
        const code = generateCode();
        // Check if code already exists
        const { data, error } = await supabase_1.supabase
            .from('orders')
            .select('esim_code')
            .eq('esim_code', code)
            .single();
        if (error && error.code === 'PGRST116') { // No rows returned
            return code;
        }
        if (error) {
            logger_1.logger.error('Error checking eSIM code uniqueness:', error);
            throw new Error('Failed to generate unique eSIM code');
        }
        // If we get here, the code exists, so we'll try again
        logger_1.logger.warn('Generated duplicate eSIM code, retrying...');
    }
    throw new Error('Failed to generate unique eSIM code after multiple attempts');
};
exports.generateEsimCode = generateEsimCode;
/**
 * Validates an eSIM code format
 */
const validateEsimCode = (code) => {
    const esimCodeRegex = /^ESIM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return esimCodeRegex.test(code);
};
exports.validateEsimCode = validateEsimCode;
/**
 * Generates LPA format QR code data for eSIM activation
 * LPA format: LPA:1$<provider>$<esim_code>$$<package_name>
 */
const generateQRCodeData = (esimCode, packageName) => {
    return `LPA:1$esimfly.al$${esimCode}$$${packageName}`;
};
exports.generateQRCodeData = generateQRCodeData;
/**
 * Type guard for AxiosError
 */
function isAxiosError(error) {
    return error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError === true;
}
/**
 * Parses a validity string like '30 days' or '7 day' to an integer number of days.
 * Returns null if parsing fails or the format is unexpected.
 *
 * Examples:
 *   '30 days' => 30
 *   '7 day'   => 7
 *   '15days'  => 15
 *   'invalid' => null
 *
 * Args:
 *   validity (string): The validity string to parse.
 *
 * Returns:
 *   number | null: The number of days, or null if parsing fails.
 */
function parseValidityToDays(validity) {
    if (typeof validity !== 'string')
        return null;
    const match = validity.match(/(\d+)\s*day(s)?/i);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    // Try to match just a number (e.g. '30')
    const numMatch = validity.match(/^(\d+)$/);
    if (numMatch && numMatch[1]) {
        return parseInt(numMatch[1], 10);
    }
    return null;
}
//# sourceMappingURL=esimUtils.js.map