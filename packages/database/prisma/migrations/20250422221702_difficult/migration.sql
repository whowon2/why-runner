/*
  Warnings:

  - Added the required column `difficulty` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "difficulty" "Difficulty" NOT NULL;
