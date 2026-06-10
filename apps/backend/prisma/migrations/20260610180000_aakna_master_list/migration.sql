-- Gahoi Samaj authoritative aakna master list (normalized; gotra links via junction)

UPDATE "profiles" SET "aakna_id" = NULL, "gotra_id" = NULL;

ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_aakna_id_fkey";

DROP TABLE IF EXISTS "aaknas";

CREATE TABLE "aakna_master" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "aakna_master_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "aakna_master_name_key" ON "aakna_master"("name");

CREATE TABLE "gotra_aakna" (
    "gotra_id" INTEGER NOT NULL,
    "aakna_master_id" INTEGER NOT NULL,

    CONSTRAINT "gotra_aakna_pkey" PRIMARY KEY ("gotra_id","aakna_master_id")
);

CREATE INDEX "gotra_aakna_aakna_master_id_idx" ON "gotra_aakna"("aakna_master_id");

ALTER TABLE "gotra_aakna" ADD CONSTRAINT "gotra_aakna_gotra_id_fkey"
  FOREIGN KEY ("gotra_id") REFERENCES "gotras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gotra_aakna" ADD CONSTRAINT "gotra_aakna_aakna_master_id_fkey"
  FOREIGN KEY ("aakna_master_id") REFERENCES "aakna_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_aakna_id_fkey"
  FOREIGN KEY ("aakna_id") REFERENCES "aakna_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "profile_family" ADD COLUMN IF NOT EXISTS "maternal_uncle_aakna_id" INTEGER;

ALTER TABLE "profile_family" ADD CONSTRAINT "profile_family_maternal_uncle_aakna_id_fkey"
  FOREIGN KEY ("maternal_uncle_aakna_id") REFERENCES "aakna_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;
