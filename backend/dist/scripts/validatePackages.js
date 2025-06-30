"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
async function main() {
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('package_id');
    if (ordersError) {
        console.error('Error fetching orders:', ordersError.message);
        process.exit(1);
    }
    const { data: pkgs, error: pkgsError } = await supabase
        .from('packages')
        .select('id');
    if (pkgsError) {
        console.error('Error fetching packages:', pkgsError.message);
        process.exit(1);
    }
    const pkgIds = pkgs.map((p) => p.id);
    const missing = orders
        .map((o) => o.package_id)
        .filter((id) => !pkgIds.includes(id));
    if (missing.length) {
        console.error('Missing package mappings:', missing);
        process.exit(1);
    }
    console.log('All orders map to existing packages.');
}
main();
//# sourceMappingURL=validatePackages.js.map