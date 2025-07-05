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

## [COMPLETED] Extract esimId from Roamify V2 response payload (2025-01-04)
- [x] **TypeScript Interfaces**: Added `RoamifyEsimOrderItem` and `RoamifyEsimOrderResponse` interfaces to match V2 API structure
- [x] **Service Updates**: Updated `createEsimOrder`, `createEsimOrderV2`, and `createOrderV2` methods to extract eSIM ID from `resp.data.data.items[0].esimId`
- [x] **Error Handling**: Added proper validation to throw error if eSIM ID is missing or invalid
- [x] **Type Safety**: Added proper TypeScript typing with `axios.post<RoamifyEsimOrderResponse>()`
- [x] **Testing**: Created and ran `test_esim_id_extraction.js` to verify extraction logic works correctly
- [x] **Fallback Support**: Updated fallback logic in `createEsimOrderV2` to also extract eSIM ID from V2 response structure

## [COMPLETED] Integrate Roamify V2 eSIM-order API with slug-based package IDs (2025-01-05)
- [x] **Database Schema**: Added `slug` column to `my_packages` table with proper indexing and constraints
- [x] **Migration**: Created migration `20250105000000_add_slug_to_my_packages.sql` to ensure slug column exists
- [x] **Package Sync**: Updated `syncRoamifyPackages.ts` to map Roamify's `data[].slug` field into `my_packages.slug`
- [x] **Payload Construction**: Updated all Roamify service methods to use slug-based package IDs instead of UUIDs
- [x] **Webhook Controller**: Updated `deliverEsim` and `handleCheckoutSessionCompleted` to prioritize slug field over features.packageId
- [x] **Package Validation**: Updated middleware to check slug field first for Roamify package ID extraction
- [x] **Fallback Logic**: Implemented country-specific fallback slugs (e.g., "esim-greece-30days-3gb-all") with proper fallback chain
- [x] **Data Migration**: Created and ran scripts to convert existing UUID slugs to proper slug-style format
- [x] **Testing**: Created comprehensive test scripts verifying end-to-end integration with Roamify V2 API
- [x] **Verification**: Confirmed payload structure matches Roamify V2 requirements: `{ items: [{ packageId: "esim-greece-30days-3gb-all", quantity: 1 }] }`

## Discovered During Work
// No new todos discovered during this task

## [COMPLETED] Implement simple Roamify eSIM order creation function (2025-01-05)
- [x] **Created `roamifyUtils.ts`**: Added simple `createEsimOrder` function matching exact API specification
- [x] **Correct Payload Structure**: Implements `{ items: [{ packageId, quantity: 1 }] }` format
- [x] **Proper Headers**: Uses Authorization Bearer token and Content-Type application/json
- [x] **Error Handling**: Includes proper error handling with try-catch
- [x] **Test Script**: Created `test_simple_roamify_order.js` to verify function works correctly
- [x] **Documentation**: Added JSDoc comments explaining usage and parameters
- [x] **Example Usage**: Included example usage function for testing
- [x] **Verification**: Confirmed function matches exact specification provided by user

## [COMPLETED] Fix Roamify 500 error handling in production (2025-01-05)
- [x] **Enhanced Error Handling**: Updated webhook controller to handle Roamify API failures gracefully
- [x] **Detailed Error Logging**: Added comprehensive error logging with status codes, response data, and headers
- [x] **Graceful Degradation**: Orders continue processing even when Roamify fails, marked for manual intervention
- [x] **Customer Communication**: Send thank you email with delay notification when Roamify fails
- [x] **Order Status Management**: Properly update order status and metadata for failed Roamify orders
- [x] **Debug Script**: Created `debug_roamify_500_error.js` to diagnose Roamify API issues
- [x] **User Orders Handling**: Updated user_orders creation to handle null Roamify data gracefully
- [x] **TypeScript Fixes**: Fixed all TypeScript compilation errors for production deployment
- [x] **Production Safety**: No breaking changes, only improved error handling and logging

## [COMPLETED] Auto-detect and fix missing slugs to prevent eSIM delivery failures (2025-01-05)
- [x] **Auto-Detection Script**: Created `auto_fix_missing_slugs.js` to scan for packages with missing slugs in `my_packages` table
- [x] **Roamify Integration**: Added functionality to fetch correct slugs from Roamify API and match them to existing packages
- [x] **Fallback Generation**: Implemented slug generation logic for packages that can't be matched to Roamify packages
- [x] **Database Updates**: Created script to update all packages with missing slugs using proper slug format
- [x] **Sync Script Updates**: Updated `sync_my_packages_with_real_packages.js` to include slug field in upsert operations
- [x] **Webhook Testing**: Created `test_webhook_slug_fix.js` to verify webhook slug extraction works correctly
- [x] **Greece Package Testing**: Added specific testing for Greece packages as mentioned in user request
- [x] **Complete Solution**: Created `complete_slug_fix_solution.js` that combines all functionality
- [x] **Verification**: Added comprehensive verification and reporting of slug coverage
- [x] **Error Prevention**: Ensured webhook will no longer fail with "No slug found" errors
- [x] **Payload Validation**: Confirmed correct Roamify V2 API payload format: `{ items: [ { packageId: "esim-greece-30days-1gb-all", quantity: 1 } ] }`

## [COMPLETED] Fix Roamify 500 error and null reference bug in webhook controller (2025-07-05)
- [x] **Root Cause Analysis**: Identified that Greece package slug `esim-gr-30days-1gb-all` was causing Roamify API 500 errors
- [x] **API Testing**: Created `debug_roamify_500_error.js` to test Roamify API and confirm correct package ID format
- [x] **Database Fix**: Updated Greece package slug from `esim-gr-30days-1gb-all` to `esim-greece-30days-1gb-all` in `my_packages` table
- [x] **Null Reference Bug Fix**: Fixed critical bug in `webhookController.ts` where `roamifyOrder.orderId` was accessed without null checks
- [x] **Error Handling Enhancement**: Improved error handling in `deliverEsim` function to prevent crashes when Roamify API fails
- [x] **Verification Testing**: Created `test_fixed_greece_package.js` to verify the fix works correctly
- [x] **API Compatibility**: Confirmed Roamify API accepts `esim-greece-30days-1gb-all` but rejects `esim-gr-30days-1gb-all`
- [x] **Production Safety**: All changes are backward compatible and include proper error handling 