-- CreateTable: Tenant
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ScoringHistory
CREATE TABLE "ScoringHistory" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoringHistory_pkey" PRIMARY KEY ("id")
);

-- Create default tenant for existing data migration
INSERT INTO "Tenant" ("id", "name", "plan", "subscriptionStatus", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Tenant', 'free', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: Add role and tenantId to User
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable: Add tenantId to Job
ALTER TABLE "Job" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- CreateIndex: Tenant
CREATE INDEX "Tenant_plan_idx" ON "Tenant"("plan");
CREATE INDEX "Tenant_subscriptionStatus_idx" ON "Tenant"("subscriptionStatus");

-- CreateIndex: User
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- CreateIndex: Job
CREATE INDEX "Job_tenantId_idx" ON "Job"("tenantId");
CREATE INDEX "Job_tenantId_userId_idx" ON "Job"("tenantId", "userId");
CREATE INDEX "Job_tenantId_status_idx" ON "Job"("tenantId", "status");
CREATE INDEX "Job_tenantId_userId_status_idx" ON "Job"("tenantId", "userId", "status");

-- CreateIndex: ScoringHistory
CREATE INDEX "ScoringHistory_jobId_idx" ON "ScoringHistory"("jobId");
CREATE INDEX "ScoringHistory_createdAt_idx" ON "ScoringHistory"("createdAt");

-- AddForeignKey: User -> Tenant
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Job -> Tenant
ALTER TABLE "Job" ADD CONSTRAINT "Job_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ScoringHistory -> Job
ALTER TABLE "ScoringHistory" ADD CONSTRAINT "ScoringHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove default values after foreign keys are created
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "Job" ALTER COLUMN "tenantId" DROP DEFAULT;
