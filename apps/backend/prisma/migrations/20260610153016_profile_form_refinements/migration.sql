/*
  Warnings:

  - Made the column `key` on table `gotras` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gotra_hindi` on table `gotras` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gotra_english` on table `gotras` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "gotras" ALTER COLUMN "key" SET NOT NULL,
ALTER COLUMN "gotra_hindi" SET NOT NULL,
ALTER COLUMN "gotra_english" SET NOT NULL;
