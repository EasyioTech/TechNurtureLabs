-- CLEANUP: Remove orphaned media assets with invalid paths
-- These records referenced course/images/ and lesson/images/ folders
-- but the actual files never existed in R2
-- Generated: 2026-04-06

-- Delete orphaned assets with course/images or lesson/images paths
DELETE FROM media_assets
WHERE file_path LIKE 'course/images/%'
   OR file_path LIKE 'lesson/images/%';

-- Verify cleanup was successful
-- Should return 0 rows
SELECT COUNT(*) as orphaned_count
FROM media_assets
WHERE file_path LIKE 'course/images/%'
   OR file_path LIKE 'lesson/images/%';

-- Summary: Display remaining valid assets by folder
SELECT folder, COUNT(*) as count, asset_type, storage_type
FROM media_assets
GROUP BY folder, asset_type, storage_type
ORDER BY folder, asset_type;
