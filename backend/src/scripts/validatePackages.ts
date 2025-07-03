import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    .select('id, days');
  if (pkgsError) {
    console.error('Error fetching packages:', pkgsError.message);
    process.exit(1);
  }
  const pkgIds = pkgs.map((p: any) => p.id);
  const missing = orders
    .map((o: any) => o.package_id)
    .filter((id: string) => !pkgIds.includes(id));
  if (missing.length) {
    console.error('Missing package mappings:', missing);
    process.exit(1);
  }
  const missingDays = pkgs.filter((p: any) => !p.days || p.days <= 0);
  if (missingDays.length) {
    console.error('Packages with missing or invalid days:', missingDays.map((p: any) => p.id));
  }
  console.log('All orders map to existing packages.');
}

main(); 