-- registo manual da migracao (checksum sha256 do migration.sql) sem BOM
INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","logs","rolled_back_at","started_at","applied_steps_count")
SELECT gen_random_uuid(), '51aae14f2c075985ac5eeba06ab293414c3f1463da5ce8e4bc3df5caa1b2196e', '2026-09-15T17:06:58.379Z', '20260915_add_employee_company_user_unique', NULL, NULL, '2026-09-15T17:06:58.379Z', 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260915_add_employee_company_user_unique');
SELECT "migration_name","checksum" FROM "_prisma_migrations" WHERE "migration_name" = '20260915_add_employee_company_user_unique';
