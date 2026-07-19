-- AlterTable
ALTER TABLE "treks" ADD COLUMN     "regionId" TEXT,
ALTER COLUMN "region" DROP NOT NULL;

-- CreateTable
CREATE TABLE "category_regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_regions_slug_categoryId_key" ON "category_regions"("slug", "categoryId");

-- AddForeignKey
ALTER TABLE "category_regions" ADD CONSTRAINT "category_regions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treks" ADD CONSTRAINT "treks_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "category_regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
