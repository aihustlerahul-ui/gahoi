-- Gahoi authoritative gotra + aakna master data

CREATE TABLE "aaknas" (
    "id" SERIAL NOT NULL,
    "gotra_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "aaknas_pkey" PRIMARY KEY ("id")
);

-- Extend gotras (legacy rows replaced on seed)
ALTER TABLE "gotras" ADD COLUMN IF NOT EXISTS "key" TEXT;
ALTER TABLE "gotras" ADD COLUMN IF NOT EXISTS "gotra_hindi" TEXT;
ALTER TABLE "gotras" ADD COLUMN IF NOT EXISTS "gotra_english" TEXT;
ALTER TABLE "gotras" ADD COLUMN IF NOT EXISTS "rishi" TEXT;
ALTER TABLE "gotras" ADD COLUMN IF NOT EXISTS "kuldevi" TEXT;

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "gotra_id" INTEGER;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "aakna_id" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "gotras_key_key" ON "gotras"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "aaknas_gotra_id_name_key" ON "aaknas"("gotra_id", "name");
CREATE INDEX IF NOT EXISTS "aaknas_gotra_id_idx" ON "aaknas"("gotra_id");
CREATE INDEX IF NOT EXISTS "idx_profiles_gotra_id" ON "profiles"("gotra_id");

ALTER TABLE "aaknas" ADD CONSTRAINT "aaknas_gotra_id_fkey"
  FOREIGN KEY ("gotra_id") REFERENCES "gotras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_gotra_id_fkey"
  FOREIGN KEY ("gotra_id") REFERENCES "gotras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_aakna_id_fkey"
  FOREIGN KEY ("aakna_id") REFERENCES "aaknas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Wipe legacy placeholder gotras (replaced by authoritative seed)
DELETE FROM "gotras";
