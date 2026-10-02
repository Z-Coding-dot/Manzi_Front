-- DropForeignKey
ALTER TABLE "guests" DROP CONSTRAINT "guests_property_id_fkey";

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
