-- Comprehensive Package-Country Mismatch Detection
-- This script identifies ALL potential inconsistencies between package names and country assignments
-- Date: 2025-07-03

-- ============================================================================
-- SECTION 1: COUNTRY-SPECIFIC PACKAGE CHECKS
-- ============================================================================

-- Check 1: Germany packages with wrong country
SELECT 
  'Germany Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Should be Germany' as suggested_fix
FROM my_packages 
WHERE (name ILIKE '%Germany%' OR name ILIKE '%German%')
  AND country_name != 'Germany'
ORDER BY data_amount;

-- Check 2: France packages with wrong country
SELECT 
  'France Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Should be France' as suggested_fix
FROM my_packages 
WHERE (name ILIKE '%France%' OR name ILIKE '%French%')
  AND country_name != 'France'
ORDER BY data_amount;

-- Check 3: Italy packages with wrong country
SELECT 
  'Italy Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Should be Italy' as suggested_fix
FROM my_packages 
WHERE (name ILIKE '%Italy%' OR name ILIKE '%Italian%')
  AND country_name != 'Italy'
ORDER BY data_amount;

-- Check 4: Spain packages with wrong country
SELECT 
  'Spain Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Should be Spain' as suggested_fix
FROM my_packages 
WHERE (name ILIKE '%Spain%' OR name ILIKE '%Spanish%')
  AND country_name != 'Spain'
ORDER BY data_amount;

-- Check 5: UK packages with wrong country
SELECT 
  'UK Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Should be United Kingdom' as suggested_fix
FROM my_packages 
WHERE (name ILIKE '%United Kingdom%' OR name ILIKE '%UK%' OR name ILIKE '%Britain%')
  AND country_name != 'United Kingdom'
ORDER BY data_amount;

-- Check 6: Dubai/UAE packages with wrong country
SELECT 
  'Dubai/UAE Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Should be Dubai' as suggested_fix
FROM my_packages 
WHERE (name ILIKE '%Dubai%' OR name ILIKE '%UAE%' OR name ILIKE '%United Arab Emirates%')
  AND country_name != 'Dubai'
ORDER BY data_amount;

-- Check 7: Turkey packages with wrong country
SELECT 
  'Turkey Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Should be Turkey' as suggested_fix
FROM my_packages 
WHERE (name ILIKE '%Turkey%' OR name ILIKE '%Turkish%')
  AND country_name != 'Turkey'
ORDER BY data_amount;

-- ============================================================================
-- SECTION 2: EUROPE & UNITED STATES CHECKS
-- ============================================================================

-- Check 8: Europe & United States packages with wrong country (should be fixed now)
SELECT 
  'Europe US Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Should be Europe & United States' as suggested_fix
FROM my_packages 
WHERE (name ILIKE '%Europe%' AND name ILIKE '%United States%')
  AND country_name != 'Europe & United States'
ORDER BY data_amount;

-- Check 9: Packages with "Europe" but not "United States" in wrong country
SELECT 
  'Europe Only Mismatch' as issue_type,
  id,
  name,
  country_name,
  data_amount,
  sale_price,
  'Check if should be specific European country' as suggested_fix
FROM my_packages 
WHERE name ILIKE '%Europe%' 
  AND name NOT ILIKE '%United States%'
  AND country_name NOT IN ('Germany', 'France', 'Italy', 'Spain', 'United Kingdom', 'Europe & United States')
ORDER BY data_amount;

-- ============================================================================
-- SECTION 3: GENERIC PATTERN MISMATCHES
-- ============================================================================

-- Check 10: Packages with specific country codes but wrong country
SELECT 
  'Country Code Mismatch' as issue_type,
  id,
  name,
  country_name,
  country_code,
  data_amount,
  'Check country_code vs country_name alignment' as suggested_fix
FROM my_packages 
WHERE country_code IS NOT NULL 
  AND (
    (country_code = 'DE' AND country_name != 'Germany') OR
    (country_code = 'FR' AND country_name != 'France') OR
    (country_code = 'IT' AND country_name != 'Italy') OR
    (country_code = 'ES' AND country_name != 'Spain') OR
    (country_code = 'GB' AND country_name != 'United Kingdom') OR
    (country_code = 'AE' AND country_name != 'Dubai') OR
    (country_code = 'TR' AND country_name != 'Turkey') OR
    (country_code = 'US' AND country_name != 'United States')
  )
ORDER BY country_code, data_amount;

-- ============================================================================
-- SECTION 4: SUMMARY STATISTICS
-- ============================================================================

-- Summary: Count of potential mismatches by type
SELECT 
  'SUMMARY' as report_section,
  issue_type,
  COUNT(*) as mismatch_count
FROM (
  -- Germany mismatches
  SELECT 'Germany Mismatch' as issue_type FROM my_packages 
  WHERE (name ILIKE '%Germany%' OR name ILIKE '%German%') AND country_name != 'Germany'
  
  UNION ALL
  
  -- France mismatches  
  SELECT 'France Mismatch' as issue_type FROM my_packages 
  WHERE (name ILIKE '%France%' OR name ILIKE '%French%') AND country_name != 'France'
  
  UNION ALL
  
  -- Italy mismatches
  SELECT 'Italy Mismatch' as issue_type FROM my_packages 
  WHERE (name ILIKE '%Italy%' OR name ILIKE '%Italian%') AND country_name != 'Italy'
  
  UNION ALL
  
  -- Spain mismatches
  SELECT 'Spain Mismatch' as issue_type FROM my_packages 
  WHERE (name ILIKE '%Spain%' OR name ILIKE '%Spanish%') AND country_name != 'Spain'
  
  UNION ALL
  
  -- UK mismatches
  SELECT 'UK Mismatch' as issue_type FROM my_packages 
  WHERE (name ILIKE '%United Kingdom%' OR name ILIKE '%UK%' OR name ILIKE '%Britain%') AND country_name != 'United Kingdom'
  
  UNION ALL
  
  -- Dubai/UAE mismatches
  SELECT 'Dubai/UAE Mismatch' as issue_type FROM my_packages 
  WHERE (name ILIKE '%Dubai%' OR name ILIKE '%UAE%' OR name ILIKE '%United Arab Emirates%') AND country_name != 'Dubai'
  
  UNION ALL
  
  -- Europe & United States mismatches
  SELECT 'Europe US Mismatch' as issue_type FROM my_packages 
  WHERE (name ILIKE '%Europe%' AND name ILIKE '%United States%') AND country_name != 'Europe & United States'
  
) mismatches
GROUP BY issue_type
ORDER BY mismatch_count DESC;

-- ============================================================================
-- SECTION 5: ALL PACKAGES OVERVIEW
-- ============================================================================

-- Final overview: All packages by country with counts
SELECT 
  country_name,
  COUNT(*) as package_count,
  MIN(data_amount) as min_data_gb,
  MAX(data_amount) as max_data_gb,
  MIN(sale_price) as min_price,
  MAX(sale_price) as max_price
FROM my_packages 
GROUP BY country_name 
ORDER BY package_count DESC, country_name; 