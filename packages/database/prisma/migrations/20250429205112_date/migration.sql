/*
  Warnings:

  - Added the required column `end` to the `Contest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endRegistration` to the `Contest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start` to the `Contest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startRegistration` to the `Contest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "end" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endRegistration" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startRegistration" TIMESTAMP(3) NOT NULL;
