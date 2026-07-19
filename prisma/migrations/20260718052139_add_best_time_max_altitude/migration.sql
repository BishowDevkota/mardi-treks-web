/*
  Warnings:

  - You are about to drop the column `heroBadge` on the `treks` table. All the data in the column will be lost.
  - You are about to drop the column `heroSubtitle` on the `treks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "treks" DROP COLUMN "heroBadge",
DROP COLUMN "heroSubtitle",
ADD COLUMN     "bestTime" TEXT,
ADD COLUMN     "maxAltitude" DOUBLE PRECISION;
