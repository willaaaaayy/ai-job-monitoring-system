-- Add unique constraint on (tenantId, url) to prevent duplicate jobs per tenant
-- First, check if Job table exists and remove any existing duplicates (keep the first one)
DO $$
DECLARE
    duplicate_record RECORD;
    table_exists BOOLEAN;
BEGIN
    -- Check if Job table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Job'
    ) INTO table_exists;

    IF table_exists THEN
        -- Remove duplicates if table exists
        FOR duplicate_record IN
            SELECT "tenantId", url, MIN(id) as keep_id, array_agg(id) as all_ids
            FROM "Job"
            GROUP BY "tenantId", url
            HAVING COUNT(*) > 1
        LOOP
            -- Delete duplicates, keeping only the first one (oldest by id)
            DELETE FROM "Job"
            WHERE "tenantId" = duplicate_record."tenantId"
              AND "url" = duplicate_record.url
              AND "id" != duplicate_record.keep_id;
        END LOOP;
    END IF;
END $$;

-- Add unique constraint (only if table exists and constraint doesn't exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Job'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'Job_tenantId_url_key'
    ) THEN
        ALTER TABLE "Job" ADD CONSTRAINT "Job_tenantId_url_key" UNIQUE ("tenantId", "url");
    END IF;
END $$;

-- Note: The status field comment was already updated in schema.prisma
-- No migration needed for the comment as it's just documentation
