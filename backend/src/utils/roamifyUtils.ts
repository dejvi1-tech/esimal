import axios from 'axios';

/**
 * Create a Roamify eSIM order with the exact API specification
 * 
 * @param roamifySlug - The Roamify package slug (e.g., 'esim-gr-30days-1gb-all')
 * @param customer - Customer information (optional, for future use)
 * @returns Promise with the Roamify order response
 */
export async function createEsimOrder(roamifySlug: string, customer?: any) {
  const url = 'https://api.getroamify.com/api/esim/order';
  const body = {
    // **must** be an array called "items"
    items: [
      {
        packageId: roamifySlug,  // e.g. 'esim-gr-30days-1gb-all'
        quantity: 1
      }
    ]
  };

  // send it exactly like this—no extra top‑level fields!
  const resp = await axios.post(url, body, {
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
export async function exampleUsage() {
  try {
    const result = await createEsimOrder('esim-gr-30days-1gb-all', { /* customer data */ });
    console.log('✔️ Roamify order created:', result);
    return result;
  } catch (err: any) {
    console.error('❌ Roamify order creation failed:', err.response?.data || err.message);
    throw err;
  }
} 