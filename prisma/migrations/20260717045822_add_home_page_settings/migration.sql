-- CreateTable
CREATE TABLE "home_page_settings" (
    "id" TEXT NOT NULL DEFAULT 'home-settings',
    "featuredTrekIds" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_page_settings_pkey" PRIMARY KEY ("id")
);
