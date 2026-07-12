-- CreateEnum
CREATE TYPE "AssetRequestStatus" AS ENUM ('PENDING_DEPT_HEAD', 'PENDING_ASSET_MANAGER', 'ALLOCATED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "asset_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assetId" TEXT,
    "reason" TEXT,
    "expectedReturnDate" TIMESTAMP(3),
    "status" "AssetRequestStatus" NOT NULL DEFAULT 'PENDING_DEPT_HEAD',
    "deptHeadApprovedById" TEXT,
    "deptHeadDecisionAt" TIMESTAMP(3),
    "deptHeadNote" TEXT,
    "assetManagerApprovedById" TEXT,
    "assetManagerDecisionAt" TIMESTAMP(3),
    "assetManagerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_requests_organizationId_idx" ON "asset_requests"("organizationId");

-- CreateIndex
CREATE INDEX "asset_requests_requestedById_idx" ON "asset_requests"("requestedById");

-- CreateIndex
CREATE INDEX "asset_requests_status_idx" ON "asset_requests"("status");

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_deptHeadApprovedById_fkey" FOREIGN KEY ("deptHeadApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_assetManagerApprovedById_fkey" FOREIGN KEY ("assetManagerApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
