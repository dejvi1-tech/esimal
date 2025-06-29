const axios = require('axios');

const ROAMIFY_API_KEY = process.env.ROAMIFY_API_KEY || "WcDVM1wpHjmcSko6HNczNGiw3f3SWkSwhU2yt5iuYZEVk3ci6LMVyM8pucQ7mTzu1jib2dQXG1hWNw7zYc9pEsFT8R399sy3FPB7KeMXt3aNjSPHb4vxJN3oBjjH4LzrPhhs2sxFKeWQf8mVAUWnWHNm6LuQrc1wv3FK2EKrCkK9frqewL2fuocTyN";
const ROAMIFY_API_URL = process.env.ROAMIFY_API_URL || 'https://api.getroamify.com';

async function printRoamifyPackages() {
  try {
    const response = await axios.get(`${ROAMIFY_API_URL}/api/esim/packages`, {
      headers: {
        'Authorization': `Bearer ${ROAMIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    const packages = response.data?.data?.packages || [];
    console.log(`Fetched ${packages.length} packages from Roamify API.`);
    packages.slice(0, 5).forEach((pkg, idx) => {
      console.log(`\nPackage #${idx + 1}:`);
      console.dir(pkg, { depth: null });
    });
  } catch (err) {
    console.error('Error fetching Roamify packages:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

printRoamifyPackages(); 