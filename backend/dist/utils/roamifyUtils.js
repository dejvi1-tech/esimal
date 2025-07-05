"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEsimOrder = createEsimOrder;
exports.exampleUsage = exampleUsage;
const axios_1 = __importDefault(require("axios"));
/**
 * Create a Roamify eSIM order with the exact API specification
 *
 * @param roamifySlug - The Roamify package slug (e.g., 'esim-gr-30days-1gb-all')
 * @param customer - Customer information (optional, for future use)
 * @returns Promise with the Roamify order response
 */
async function createEsimOrder(roamifySlug, customer) {
    const url = 'https://api.getroamify.com/api/esim/order';
    const body = {
        // **must** be an array called "items"
        items: [
            {
                packageId: roamifySlug, // e.g. 'esim-gr-30days-1gb-all'
                quantity: 1
            }
        ]
    };
    // send it exactly like this—no extra top‑level fields!
    const resp = await axios_1.default.post(url, body, {
        headers: {
            Authorization: `Bearer ${process.env.ROAMIFY_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    return resp.data;
}
/**
 * Example usage function for testing
 */
async function exampleUsage() {
    try {
        const result = await createEsimOrder('esim-gr-30days-1gb-all', { /* customer data */});
        console.log('✔️ Roamify order created:', result);
        return result;
    }
    catch (err) {
        console.error('❌ Roamify order creation failed:', err.response?.data || err.message);
        throw err;
    }
}
//# sourceMappingURL=roamifyUtils.js.map