-- AlterTable
ALTER TABLE "crm_contacts" ADD COLUMN     "autoTracked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completedTrekIds" TEXT;
