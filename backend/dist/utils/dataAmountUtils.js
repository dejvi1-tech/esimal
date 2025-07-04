"use strict";
/**
 * Utility functions for handling data amount conversions
 * Handles conversion from Roamify formats to standardized GB values for database storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDataAmountToGB = parseDataAmountToGB;
exports.formatDataAmountForDisplay = formatDataAmountForDisplay;
exports.fixIncorrectDataAmount = fixIncorrectDataAmount;
exports.extractDataAmountFromName = extractDataAmountFromName;
/**
 * Parse Roamify data amount string/number to GB for database storage
 * Examples:
 * - "3GB" -> 3
 * - "500MB" -> 0.5
 * - "1024MB" -> 1
 * - 3072 (if it's MB) -> 3
 * - "Unlimited" -> 0 (special case)
 */
function parseDataAmountToGB(input) {
    if (!input && input !== 0)
        return 0;
    // Handle unlimited cases
    if (typeof input === 'string' && input.toLowerCase().includes('unlimited')) {
        return 0; // Special case for unlimited
    }
    // Handle string inputs like "3GB", "500MB"
    if (typeof input === 'string') {
        const match = input.match(/(\d+(?:\.\d+)?)\s*(GB|MB|KB)?/i);
        if (!match)
            return 0;
        const value = parseFloat(match[1]);
        const unit = match[2]?.toUpperCase() || 'GB'; // Default to GB if no unit
        switch (unit) {
            case 'GB':
                return value;
            case 'MB':
                return value / 1024; // Convert MB to GB
            case 'KB':
                return value / 1024 / 1024; // Convert KB to GB
            default:
                return value; // Assume GB
        }
    }
    // Handle numeric inputs
    if (typeof input === 'number') {
        // If the number is very large (>100), it might be incorrectly stored MB
        if (input > 100) {
            // Check if it's a common conversion pattern (3072 = 3*1024, 15360 = 15*1024)
            if (input % 1024 === 0) {
                const gbValue = input / 1024;
                if (gbValue <= 100) { // Reasonable GB amount
                    return gbValue;
                }
            }
        }
        // Otherwise assume it's already in GB
        return input;
    }
    return 0;
}
/**
 * Format data amount for display (frontend utility)
 */
function formatDataAmountForDisplay(valueInGB) {
    if (valueInGB === 0)
        return 'Unlimited';
    if (valueInGB >= 1) {
        return valueInGB % 1 === 0 ? `${valueInGB} GB` : `${valueInGB.toFixed(1)} GB`;
    }
    // For values less than 1 GB, show as MB
    const mb = Math.round(valueInGB * 1024);
    return `${mb} MB`;
}
/**
 * Fix incorrectly stored data amounts in my_packages table
 * Common incorrect patterns:
 * - 1024 -> 1 GB
 * - 3072 -> 3 GB
 * - 5120 -> 5 GB
 * - 10240 -> 10 GB
 * - 15360 -> 15 GB
 * - 20480 -> 20 GB
 * - 30720 -> 30 GB
 * - 51200 -> 50 GB
 */
function fixIncorrectDataAmount(currentValue) {
    const commonConversions = {
        1024: 1,
        3072: 3,
        5120: 5,
        10240: 10,
        15360: 15,
        20480: 20,
        30720: 30,
        51200: 50
    };
    // Check if it's a known incorrect conversion
    if (commonConversions[currentValue]) {
        return commonConversions[currentValue];
    }
    // Check if it's a multiple of 1024 and convert
    if (currentValue > 100 && currentValue % 1024 === 0) {
        const gbValue = currentValue / 1024;
        if (gbValue <= 100) { // Reasonable GB amount
            return gbValue;
        }
    }
    // If it's already reasonable, keep it
    return currentValue;
}
/**
 * Extract data amount from Roamify package name
 * Examples: "Europe 3GB", "Albania 15GB", "Global Unlimited"
 */
function extractDataAmountFromName(name) {
    if (!name)
        return 0;
    // Check for unlimited
    if (name.toLowerCase().includes('unlimited')) {
        return 0;
    }
    // Look for GB/MB patterns in the name
    const gbMatch = name.match(/(\d+)\s*GB/i);
    if (gbMatch) {
        return parseInt(gbMatch[1]);
    }
    const mbMatch = name.match(/(\d+)\s*MB/i);
    if (mbMatch) {
        return parseInt(mbMatch[1]) / 1024;
    }
    return 0;
}
//# sourceMappingURL=dataAmountUtils.js.map