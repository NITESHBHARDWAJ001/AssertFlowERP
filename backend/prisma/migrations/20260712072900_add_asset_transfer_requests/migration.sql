-- CreateEnum
CREATE TYPE "TransferRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "asset_transfer_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "fromHolderId" TEXT,
    "toHolderId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "TransferRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_transfer_requests_organizationId_idx" ON "asset_transfer_requests"("organizationId");

-- CreateIndex
CREATE INDEX "asset_transfer_requests_assetId_idx" ON "asset_transfer_requests"("assetId");

-- CreateIndex
CREATE INDEX "asset_transfer_requests_status_idx" ON "asset_transfer_requests"("status");

-- AddForeignKey
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_fromHolderId_fkey" FOREIGN KEY ("fromHolderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_toHolderId_fkey" FOREIGN KEY ("toHolderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
