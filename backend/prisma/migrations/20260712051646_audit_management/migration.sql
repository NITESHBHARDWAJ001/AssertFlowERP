-- CreateEnum
CREATE TYPE "AuditCycleStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuditItemStatus" AS ENUM ('PENDING', 'VERIFIED', 'MISSING', 'DAMAGED');

-- CreateTable
CREATE TABLE "audit_cycles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "auditorId" TEXT NOT NULL,
    "status" "AuditCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_items" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" "AuditItemStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_cycles_organizationId_idx" ON "audit_cycles"("organizationId");

-- CreateIndex
CREATE INDEX "audit_items_cycleId_idx" ON "audit_items"("cycleId");

-- CreateIndex
CREATE INDEX "audit_items_assetId_idx" ON "audit_items"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "audit_items_cycleId_assetId_key" ON "audit_items"("cycleId", "assetId");

-- AddForeignKey
ALTER TABLE "audit_cycles" ADD CONSTRAINT "audit_cycles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_cycles" ADD CONSTRAINT "audit_cycles_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_cycles" ADD CONSTRAINT "audit_cycles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "audit_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
