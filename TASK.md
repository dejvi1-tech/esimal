## [IN PROGRESS] Enforce country-package consistency across frontend, backend, and tests (2024-06-13)
- Require country_code for all package fetches and order flows
- Validate package-country match server-side
- Update frontend to use mapSlugToCode and pass country_code
- Add Pytest tests for country-package consistency 