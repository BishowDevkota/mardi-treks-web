/*
  Warnings:

  - You are about to drop the column `heroBadge` on the `home_page_settings` table. All the data in the column will be lost.
  - You are about to drop the column `heroSubtitle` on the `home_page_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "home_page_settings" DROP COLUMN "heroBadge",
DROP COLUMN "heroSubtitle";
