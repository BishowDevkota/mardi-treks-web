ALTER TABLE "trek_itinerary"
ADD COLUMN "accommodationDescription" TEXT,
ADD COLUMN "accommodationLat" DOUBLE PRECISION,
ADD COLUMN "accommodationLng" DOUBLE PRECISION,
ADD COLUMN "travelModes" TEXT,
ADD COLUMN "travelStartLabel" TEXT,
ADD COLUMN "travelStartLat" DOUBLE PRECISION,
ADD COLUMN "travelStartLng" DOUBLE PRECISION,
ADD COLUMN "travelEndLabel" TEXT,
ADD COLUMN "travelEndLat" DOUBLE PRECISION,
ADD COLUMN "travelEndLng" DOUBLE PRECISION;
