-- AlterTable: users — terms acceptance timestamp
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);

-- AlterTable: profiles — extended personal & lifestyle fields
ALTER TABLE "profiles" ADD COLUMN "first_name" TEXT;
ALTER TABLE "profiles" ADD COLUMN "last_name" TEXT;
ALTER TABLE "profiles" ADD COLUMN "place_of_birth" TEXT;
ALTER TABLE "profiles" ADD COLUMN "nakshatra" TEXT;
ALTER TABLE "profiles" ADD COLUMN "zodiac" TEXT;
ALTER TABLE "profiles" ADD COLUMN "weight_kg" DOUBLE PRECISION;
ALTER TABLE "profiles" ADD COLUMN "mobile_country_code" INTEGER NOT NULL DEFAULT 91;
ALTER TABLE "profiles" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "profiles" ADD COLUMN "mother_tongue" TEXT;
ALTER TABLE "profiles" ADD COLUMN "disability" TEXT NOT NULL DEFAULT 'No';
ALTER TABLE "profiles" ADD COLUMN "profile_created_by" TEXT;
ALTER TABLE "profiles" ADD COLUMN "blood_group" TEXT;
ALTER TABLE "profiles" ADD COLUMN "dietary_habit" TEXT;
ALTER TABLE "profiles" ADD COLUMN "town" TEXT;

-- AlterTable: profile_education
ALTER TABLE "profile_education" ADD COLUMN "educational_detail" TEXT;

-- AlterTable: profile_occupation
ALTER TABLE "profile_occupation" ADD COLUMN "occupation_detail" TEXT;

-- AlterTable: profile_family — sibling breakdown, assets, addresses
ALTER TABLE "profile_family" ADD COLUMN "married_brothers" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "profile_family" ADD COLUMN "unmarried_brothers" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "profile_family" ADD COLUMN "married_sisters" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "profile_family" ADD COLUMN "unmarried_sisters" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "profile_family" ADD COLUMN "maternal_uncle_name" TEXT;
ALTER TABLE "profile_family" ADD COLUMN "maternal_uncle_aakna" TEXT;
ALTER TABLE "profile_family" ADD COLUMN "has_house" TEXT;
ALTER TABLE "profile_family" ADD COLUMN "has_car" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profile_family" ADD COLUMN "permanent_address" TEXT;
