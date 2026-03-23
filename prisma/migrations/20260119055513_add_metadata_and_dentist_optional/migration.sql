/*
  Warnings:

  - You are about to drop the column `matricula` on the `Dentist` table. All the data in the column will be lost.
  - You are about to drop the column `preferences` on the `Dentist` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_dentistId_fkey";

-- AlterTable
ALTER TABLE "Dentist" DROP COLUMN "matricula",
DROP COLUMN "preferences",
ADD COLUMN     "deliveryMethod" TEXT,
ADD COLUMN     "matriculaNac" TEXT,
ADD COLUMN     "matriculaProv" TEXT,
ADD COLUMN     "resultPreference" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "equipmentName" TEXT,
ALTER COLUMN "dentistId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "affiliateNumber" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
