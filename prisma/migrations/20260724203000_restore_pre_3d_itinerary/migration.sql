-- Restore pre-3D itinerary structure
-- This migration reverts the itinerary to the flat dayNumber-based structure
-- and removes the 3D travel/accommodation map fields.

-- Drop the 3D map columns that were added in the previous migration
ALTER TABLE "trek_itinerary" DROP COLUMN IF EXISTS "travelMode";
ALTER TABLE "trek_itinerary" DROP COLUMN IF EXISTS "accommodationMap";
ALTER TABLE "trek_itinerary" DROP COLUMN IF EXISTS "travelNotes";
ALTER TABLE "trek_itinerary" DROP COLUMN IF EXISTS "waypoints";

-- Drop ordered travel points if they exist
DROP TABLE IF EXISTS "ordered_travel_points";
