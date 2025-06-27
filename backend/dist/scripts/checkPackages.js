"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Create a Supabase client with service role key to bypass RLS
const supabaseAdmin = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
async function checkPackages() {
    try {
        console.log('Checking packages in database...');
        const { data, error } = await supabaseAdmin
            .from('packages')
            .select('*')
            .limit(5);
        if (error) {
            console.error('Error fetching packages:', error);
            return;
        }
        console.log(`Found ${data?.length || 0} packages in database`);
        if (data && data.length > 0) {
            console.log('First package:', data[0]);
        }
        // Check total count
        const { count, error: countError } = await supabaseAdmin
            .from('packages')
            .select('*', { count: 'exact', head: true });
        if (countError) {
            console.error('Error counting packages:', countError);
            return;
        }
        console.log(`Total packages in database: ${count}`);
    }
    catch (error) {
        console.error('Failed to check packages:', error);
    }
}
checkPackages();
//# sourceMappingURL=checkPackages.js.map