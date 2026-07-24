ALTER TABLE "crm_deals" ADD COLUMN "bookingId" TEXT;

CREATE UNIQUE INDEX "crm_deal_stages_name_key" ON "crm_deal_stages"("name");
CREATE UNIQUE INDEX "crm_deals_bookingId_key" ON "crm_deals"("bookingId");

ALTER TABLE "crm_deals"
ADD CONSTRAINT "crm_deals_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
