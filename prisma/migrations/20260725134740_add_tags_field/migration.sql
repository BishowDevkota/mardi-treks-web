/*
  Warnings:

  - You are about to drop the column `ogImage` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `ogImage` on the `treks` table. All the data in the column will be lost.
  - You are about to drop the `trek_highlights` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "trek_highlights" DROP CONSTRAINT "trek_highlights_trekId_fkey";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "ogImage";

-- AlterTable
ALTER TABLE "treks" DROP COLUMN "ogImage",
ADD COLUMN     "tags" TEXT;

-- DropTable
DROP TABLE "trek_highlights";
