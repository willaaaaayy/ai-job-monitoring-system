-- Add unique constraint on (tenantId, url) to prevent duplicate jobs per tenant
-- First, remove any existing duplicates (keep the first one)
DO $$
DECLARE
    duplicate_record RECORD;
BEGIN
    FOR duplicate_record IN
        SELECT tenantId, url, MIN(id) as keep_id, array_agg(id) as all_ids
        FROM "Job"
        GROUP BY tenantId, url
        HAVING COUNT(*) > 1
    LOOP
        -- Delete duplicates, keeping only the first one (oldest by id)
        DELETE FROM "Job"
        WHERE "tenantId" = duplicate_record.tenantId
          AND "url" = duplicate_record.url
          AND "id" != duplicate_record.keep_id;
    END LOOP;
END $$;

-- Add unique constraint
ALTER TABLE "Job" ADD CONSTRAINT "Job_tenantId_url_key" UNIQUE ("tenantId", "url");

-- Note: The status field comment was already updated in schema.prisma
-- No migration needed for the comment as it's just documentation
