## [IN PROGRESS] Enforce country-package consistency across frontend, backend, and tests (2024-06-13)
- Require country_code for all package fetches and order flows
- Validate package-country match server-side
- Update frontend to use mapSlugToCode and pass country_code
- Add Pytest tests for country-package consistency
- [x] Fix TS2769 errors in orderRoutes.ts & packageRoutes.ts: Refactored all route handlers to use express-async-handler, matching Express's RequestHandler signature and eliminating TS2769 errors. (2024-06-29)
- Eliminate "Package not found" fallback and enforce strict package lookup (2024-06-30): COMPLETED
  - Seeded Supabase packages table with country-specific Roamify IDs (migration 20250630_seed_packages.sql)
  - Removed all fallback logic in delivery and Roamify services/controllers
  - Added /backend/src/scripts/validatePackages.ts and package.json script for daily validation
- [x] Implemented formatDataAmount utility in src/utils/formatDataAmount.ts and updated all public package displays to use it for data_amount (2024-07-11)
- [x] Frontend routing & packages page overhaul (remove /bundle, repurpose /packages, add redirect, update links) - Completed on 2024-07-07
  - Removed all /bundle routes, links, and components
  - Added redirect from /bundle/:country to /country/:country
  - /packages now lists all available countries dynamically
  - All navigation flows through /country/:country and /packages
  - Obsolete files deleted: BundlePackagesSection.tsx, BundlePage.tsx
  - No backend changes required

## Discovered During Work
// No new todos discovered during this task 