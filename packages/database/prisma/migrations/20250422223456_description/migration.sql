/*
  Warnings:

  - You are about to drop the column `inputs` on the `Problem` table. All the data in the column will be lost.
  - You are about to drop the column `outputs` on the `Problem` table. All the data in the column will be lost.
  - Added the required column `constraints` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputFormat` to the `Problem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outputFormat` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Problem" DROP COLUMN "inputs",
DROP COLUMN "outputs",
ADD COLUMN     "constraints" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "inputFormat" TEXT NOT NULL,
ADD COLUMN     "outputFormat" TEXT NOT NULL;
