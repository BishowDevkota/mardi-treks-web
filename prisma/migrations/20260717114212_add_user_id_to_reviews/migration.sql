-- AlterTable
ALTER TABLE "trek_reviews" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "trek_reviews" ADD CONSTRAINT "trek_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
