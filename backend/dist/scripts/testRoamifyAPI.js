"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
async function testRoamifyAPI() {
    if (!ROAMIFY_API_KEY) {
        console.error('ROAMIFY_API_KEY not set');
        return;
    }
    console.log('Testing Roamify API...');
    console.log('API Key (first 10 chars):', ROAMIFY_API_KEY.substring(0, 10) + '...');
    try {
        const response = await axios_1.default.get('https://api.getroamify.com/api/esim/packages', {
            headers: {
                Authorization: `Bearer ${ROAMIFY_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('\n=== API RESPONSE DETAILS ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', JSON.stringify(response.headers, null, 2));
        console.log('\n=== RESPONSE DATA ===');
        console.log('Type of response.data:', typeof response.data);
        console.log('Is Array?', Array.isArray(response.data));
        console.log('Keys in response.data:', Object.keys(response.data || {}));
        console.log('\n=== FULL RESPONSE DATA ===');
        console.log(JSON.stringify(response.data, null, 2));
        // Check for common patterns
        if (response.data && typeof response.data === 'object') {
            console.log('\n=== CHECKING COMMON PATTERNS ===');
            if (response.data.data) {
                console.log('response.data.data type:', typeof response.data.data);
                console.log('response.data.data is array:', Array.isArray(response.data.data));
                if (Array.isArray(response.data.data)) {
                    console.log('response.data.data length:', response.data.data.length);
                }
            }
            if (response.data.packages) {
                console.log('response.data.packages type:', typeof response.data.packages);
                console.log('response.data.packages is array:', Array.isArray(response.data.packages));
                if (Array.isArray(response.data.packages)) {
                    console.log('response.data.packages length:', response.data.packages.length);
                }
            }
            if (response.data.items) {
                console.log('response.data.items type:', typeof response.data.items);
                console.log('response.data.items is array:', Array.isArray(response.data.items));
                if (Array.isArray(response.data.items)) {
                    console.log('response.data.items length:', response.data.items.length);
                }
            }
            if (response.data.results) {
                console.log('response.data.results type:', typeof response.data.results);
                console.log('response.data.results is array:', Array.isArray(response.data.results));
                if (Array.isArray(response.data.results)) {
                    console.log('response.data.results length:', response.data.results.length);
                }
            }
        }
    }
    catch (error) {
        console.error('\n=== API ERROR ===');
        console.error('Error:', error.message);
        if (error && typeof error === 'object' && 'response' in error) {
            const apiError = error;
            console.error('Error Status:', apiError.response?.status);
            console.error('Error Data:', JSON.stringify(apiError.response?.data, null, 2));
            console.error('Error Headers:', JSON.stringify(apiError.response?.headers, null, 2));
        }
        else if (error && typeof error === 'object' && 'request' in error) {
            console.error('No response received:', error.request);
        }
    }
}
testRoamifyAPI().catch(console.error);
//# sourceMappingURL=testRoamifyAPI.js.map