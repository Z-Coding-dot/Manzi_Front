ALTER TABLE "guests" ADD COLUMN "property_id" TEXT;
CREATE INDEX "guests_property_id_idx" ON "guests"("property_id");
ALTER TABLE "guests" ADD CONSTRAINT "guests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
