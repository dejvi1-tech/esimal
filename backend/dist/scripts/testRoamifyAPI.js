"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require('axios');
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const ROAMIFY_API_BASE = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';
const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY;
async function testRoamifyAPI() {
    if (!ROAMIFY_API_KEY) {
        console.error('ROAMIFY_API_KEY not set');
        return;
    }
    console.log('Testing Roamify API...');
    console.log('API Key (first 10 chars):', ROAMIFY_API_KEY.substring(0, 10) + '...');
    try {
        // Test with different parameters to see if we can get more packages
        const testParams = [
            {}, // No parameters
            { limit: 1000 }, // Default limit
            { limit: 10000 }, // Higher limit
            { limit: 10000, offset: 0 }, // With offset
            { all: true }, // All parameter
            { limit: 10000, offset: 0, all: true } // Combined
        ];
        for (let i = 0; i < testParams.length; i++) {
            const params = testParams[i];
            console.log(`\n=== Test ${i + 1}: ${JSON.stringify(params)} ===`);
            try {
                const response = await axios.get(`${ROAMIFY_API_BASE}/api/esim/packages`, {
                    headers: {
                        Authorization: `Bearer ${ROAMIFY_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    params,
                    timeout: 30000
                });
                console.log('Status:', response.status);
                console.log('Status Text:', response.statusText);
                const data = response.data;
                console.log('Response type:', typeof data);
                console.log('Response keys:', Object.keys(data || {}));
                // Count total packages
                let totalPackages = 0;
                if (data && data.status === 'success' && data.data && data.data.packages && Array.isArray(data.data.packages)) {
                    for (const country of data.data.packages) {
                        if (country.packages && Array.isArray(country.packages)) {
                            totalPackages += country.packages.length;
                        }
                    }
                }
                console.log('Total packages found:', totalPackages);
                if (totalPackages > 0) {
                    console.log('Sample country packages:', data.data.packages[0]?.packages?.length || 0);
                    console.log('First package sample:', data.data.packages[0]?.packages?.[0] || 'None');
                }
            }
            catch (error) {
                console.error('❌ Failed to fetch from Roamify:', ROAMIFY_API_BASE, error);
                console.error(`Test ${i + 1} failed:`, error.message);
                if (error.response) {
                    console.error('Error status:', error.response.status);
                    console.error('Error data:', error.response.data);
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}
testRoamifyAPI().catch(console.error);
//# sourceMappingURL=testRoamifyAPI.js.map