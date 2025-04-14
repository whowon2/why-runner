/*
  Warnings:

  - You are about to drop the `TestCase` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TestCase" DROP CONSTRAINT "TestCase_problemId_fkey";

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "inputs" TEXT[],
ADD COLUMN     "outputs" TEXT[];

-- DropTable
DROP TABLE "TestCase";
