## [COMPLETED] Rename validity_days to days across the entire project (2025-01-04)
- [x] **SQL Schema Migration**: Created migration `20250104000000_rename_validity_days_to_days.sql` to rename `validity_days` → `days` in both `packages` and `my_packages` tables
- [x] **Database Verification**: Confirmed both tables now have `days` column (integer) with proper constraints
- [x] **Roamify Service Updates**: 
  - Changed create-order endpoint from `/api/orders` to `/api/esim/order`
  - Updated payload structure to include `days` field: `{ packageId, quantity, days }`
  - Updated both `createEsimOrder` and `createEsimOrderV2` methods
- [x] **Webhook Controller**: Added extraction of `days` from payment metadata and passed to Roamify service
- [x] **Sync Script**: Updated `syncRoamifyPackages.ts` to parse `data.days` from Roamify API response
- [x] **Frontend Admin Panel**: Updated all references from `validity_days` to `days` in package handling
- [x] **TypeScript Interfaces**: Updated `RoamifyPackage` interface and `roamifyMapper.ts` to use `days` field
- [x] **Email Templates**: Already using `days` field in `EmailTemplateData` interface
- [x] **Testing**: Created and ran verification scripts confirming all changes work correctly

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
- [x] Fix 404 on `/country/:slug` routes and enforce slug consistency (2024-07-08)
  - Moved `/country/:slug` route above catch-all in router
  - Added legacy redirects for `/bundle/:country` and `/country/:code`
  - Centralized slug generation with `countrySlug` using `slugify`
  - Updated all links, fetches, and helpers to use slugified country names
  - Updated CountryPage to show empty/error states instead of 404
- [x] Enhance /country/:slug to show both country and region pages (2024-07-11)
  - CountryPage now detects if slug is a country or region, tries country fetch, then region fallback
  - Added decodeSlug and capitalize helpers to src/lib/utils.ts
  - Added/updated unit tests for slug helpers and CountryPage (country, region, empty, error cases)

## [COMPLETED] Switch Roamify V2 order payload to use items array (2025-01-04)
- [x] **TypeScript Interfaces**: Added `RoamifyOrderItem` and `RoamifyEsimOrderRequest` interfaces to `roamifyService.ts`
- [x] **Service Updates**: Updated `createEsimOrder`, `createEsimOrderV2`, and `createOrderV2` methods to use new items array format
- [x] **Payload Structure**: Changed from top-level `{ packageId, quantity, days }` to `{ items: [{ packageId, quantity, days }] }`
- [x] **Default Values**: Added default `days: 30` when not specified to ensure compatibility
- [x] **Testing**: Created `test_roamify_v2_payload.js` to verify new format works and old format fails as expected
- [x] **Backward Compatibility**: All existing method signatures remain unchanged, only internal payload structure updated

## [COMPLETED] Drop days field from Roamify V2 order payload (2024-07-11)
- [x] Removed days property from RoamifyOrderItem and RoamifyEsimOrderRequest interfaces in roamifyService.ts
- [x] Updated createEsimOrder, createEsimOrderV2, and createOrderV2 to no longer send days in the payload
- [x] Updated webhook controller and all usages to remove days from order creation
- [x] Updated test_roamify_v2_payload.js and added test_payload_structure.js to verify correct payload
- [x] Verified build and payload structure; all code, types, and tests now match Roamify V2 API requirements

## Discovered During Work
// No new todos discovered during this task 