## [IN PROGRESS] Enforce country-package consistency across frontend, backend, and tests (2024-06-13)
- Require country_code for all package fetches and order flows
- Validate package-country match server-side
- Update frontend to use mapSlugToCode and pass country_code
- Add Pytest tests for country-package consistency
- [x] Fix TS2769 errors in orderRoutes.ts & packageRoutes.ts: Refactored all route handlers to use express-async-handler, matching Express's RequestHandler signature and eliminating TS2769 errors. (2024-06-29)

## Discovered During Work
// Add any new sub-tasks or TODOs here as they arise. 