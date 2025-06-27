"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}
// Create a Supabase client with the service role key
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
async function runMigration() {
    try {
        console.log('Executing migration: 20240324000000_add_most_popular_fields.sql');
        // Execute each SQL statement separately
        const sqlStatements = [
            'ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS location_slug text;',
            'ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS show_on_frontend boolean DEFAULT false;',
            'ALTER TABLE my_packages ADD COLUMN IF NOT EXISTS homepage_order integer DEFAULT 0;',
            'CREATE INDEX IF NOT EXISTS idx_my_packages_location_slug ON my_packages(location_slug);',
            'CREATE INDEX IF NOT EXISTS idx_my_packages_show_on_frontend ON my_packages(show_on_frontend);',
            'CREATE INDEX IF NOT EXISTS idx_my_packages_homepage_order ON my_packages(homepage_order);',
            'CREATE INDEX IF NOT EXISTS idx_my_packages_frontend_display ON my_packages(location_slug, show_on_frontend, homepage_order);'
        ];
        for (const sql of sqlStatements) {
            console.log('Executing:', sql);
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
            if (error) {
                console.error('Error executing SQL:', sql, error);
                // Continue with other statements even if one fails
            }
            else {
                console.log('Successfully executed:', sql);
            }
        }
        console.log('Migration completed successfully');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
// Run the migration
runMigration();
//# sourceMappingURL=runMigration.js.map