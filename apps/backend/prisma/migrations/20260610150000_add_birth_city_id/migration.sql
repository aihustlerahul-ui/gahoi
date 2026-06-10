-- Separate birth city from living city
ALTER TABLE "profiles" ADD COLUMN "birth_city_id" INTEGER;

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_birth_city_id_fkey"
  FOREIGN KEY ("birth_city_id") REFERENCES "locations_city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_profiles_birth_city" ON "profiles"("birth_city_id");

-- Backfill birth city from legacy free-text place_of_birth where city name matches
UPDATE "profiles" p
SET "birth_city_id" = c.id
FROM "locations_city" c
WHERE p."birth_city_id" IS NULL
  AND p."place_of_birth" IS NOT NULL
  AND lower(trim(p."place_of_birth")) = lower(trim(c.name));

-- Default birth city to living city when still unset
UPDATE "profiles"
SET "birth_city_id" = "living_city_id"
WHERE "birth_city_id" IS NULL AND "living_city_id" IS NOT NULL;
