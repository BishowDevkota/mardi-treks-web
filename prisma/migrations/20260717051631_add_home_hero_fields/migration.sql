-- AlterTable
ALTER TABLE "home_page_settings" ADD COLUMN     "heroBadge" TEXT,
ADD COLUMN     "heroDescription" TEXT,
ADD COLUMN     "heroEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "heroSubtitle" TEXT,
ADD COLUMN     "heroTitle" TEXT,
ADD COLUMN     "heroTitleHighlight" TEXT;
