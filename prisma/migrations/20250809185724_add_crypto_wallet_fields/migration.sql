/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "walletAddress" TEXT,
ADD COLUMN     "walletBalance" DECIMAL(18,8),
ADD COLUMN     "walletType" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");
