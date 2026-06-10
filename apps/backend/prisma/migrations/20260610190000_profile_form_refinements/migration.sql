-- Height ft/in columns (height_cm retained for legacy index/backfill)
ALTER TABLE "profiles" ADD COLUMN "height_ft" INTEGER;
ALTER TABLE "profiles" ADD COLUMN "height_in" INTEGER;

ALTER TABLE "profile_partner_preferences" ADD COLUMN "height_min_ft" INTEGER;
ALTER TABLE "profile_partner_preferences" ADD COLUMN "height_min_in" INTEGER;
ALTER TABLE "profile_partner_preferences" ADD COLUMN "height_max_ft" INTEGER;
ALTER TABLE "profile_partner_preferences" ADD COLUMN "height_max_in" INTEGER;

-- Backfill ft/in from existing cm where possible
UPDATE "profiles"
SET
  "height_ft" = FLOOR(ROUND("height_cm" / 2.54) / 12),
  "height_in" = MOD(ROUND("height_cm" / 2.54), 12)
WHERE "height_cm" IS NOT NULL AND "height_ft" IS NULL;

UPDATE "profile_partner_preferences"
SET
  "height_min_ft" = FLOOR(ROUND("height_min_cm" / 2.54) / 12),
  "height_min_in" = MOD(ROUND("height_min_cm" / 2.54), 12)
WHERE "height_min_cm" IS NOT NULL AND "height_min_ft" IS NULL;

UPDATE "profile_partner_preferences"
SET
  "height_max_ft" = FLOOR(ROUND("height_max_cm" / 2.54) / 12),
  "height_max_in" = MOD(ROUND("height_max_cm" / 2.54), 12)
WHERE "height_max_cm" IS NOT NULL AND "height_max_ft" IS NULL;

-- Rename father_mobile → parent_mobile (parent contact number)
ALTER TABLE "profile_family" RENAME COLUMN "father_mobile" TO "parent_mobile";
