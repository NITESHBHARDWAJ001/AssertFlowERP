-- AlterEnum
ALTER TYPE "AssetStatus" ADD VALUE 'LOST';

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "condition" TEXT,
ADD COLUMN     "location" TEXT;
