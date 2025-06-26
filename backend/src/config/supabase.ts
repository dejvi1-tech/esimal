import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
config({ path: path.resolve(__dirname, '../../.env') });

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseDbUrl = process.env.SUPABASE_DB_URL || process.env.DB_HOST;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be provided in your .env file.");
}

if (!supabaseDbUrl) {
  console.warn("SUPABASE_DB_URL (or DB_HOST) is not provided. (Check your .env file.)");
}

export const supabase = createClient(supabaseUrl, supabaseKey); 