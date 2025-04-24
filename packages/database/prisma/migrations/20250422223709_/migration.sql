/*
  Warnings:

  - You are about to drop the column `constraints` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `inputFormat` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `outputFormat` on the `Problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "constraints",
DROP COLUMN "description",
DROP COLUMN "inputFormat",
DROP COLUMN "outputFormat",
ADD COLUMN     "inputs" TEXT[],
ADD COLUMN     "outputs" TEXT[];
