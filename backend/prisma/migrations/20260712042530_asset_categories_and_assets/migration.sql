-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('REGISTERED', 'AVAILABLE', 'ALLOCATED', 'TRANSFERRED', 'RESERVED', 'MAINTENANCE', 'RETURNED', 'RETIRED', 'DISPOSED');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "assetTagPrefix" TEXT NOT NULL DEFAULT 'AST',
ADD COLUMN     "assetTagSequence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "customFieldsSchema" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'REGISTERED',
    "currentHolderId" TEXT,
    "currentDepartmentId" TEXT,
    "vendor" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(12,2),
    "warrantyExpiry" TIMESTAMP(3),
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qrCodeUrl" TEXT,
    "notes" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_history" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "AssetStatus",
    "toStatus" "AssetStatus",
    "fromHolderId" TEXT,
    "toHolderId" TEXT,
    "note" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_categories_organizationId_idx" ON "asset_categories"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_organizationId_name_key" ON "asset_categories"("organizationId", "name");

-- CreateIndex
CREATE INDEX "assets_organizationId_idx" ON "assets"("organizationId");

-- CreateIndex
CREATE INDEX "assets_categoryId_idx" ON "assets"("categoryId");

-- CreateIndex
CREATE INDEX "assets_currentDepartmentId_idx" ON "assets"("currentDepartmentId");

-- CreateIndex
CREATE INDEX "assets_currentHolderId_idx" ON "assets"("currentHolderId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_organizationId_assetTag_key" ON "assets"("organizationId", "assetTag");

-- CreateIndex
CREATE INDEX "asset_history_assetId_idx" ON "asset_history"("assetId");

-- AddForeignKey
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_currentHolderId_fkey" FOREIGN KEY ("currentHolderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_currentDepartmentId_fkey" FOREIGN KEY ("currentDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
