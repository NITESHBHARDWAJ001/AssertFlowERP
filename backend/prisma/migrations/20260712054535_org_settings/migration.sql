-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "bookingRequiresApproval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "maintenanceRequiresApproval" BOOLEAN NOT NULL DEFAULT true;
