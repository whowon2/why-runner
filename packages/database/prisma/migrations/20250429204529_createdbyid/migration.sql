/*
  Warnings:

  - You are about to drop the column `userId` on the `Contest` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `Contest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Contest" DROP CONSTRAINT "Contest_userId_fkey";

-- AlterTable
ALTER TABLE "Contest" DROP COLUMN "userId",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
