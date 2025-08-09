/*
  Warnings:

  - You are about to drop the column `walletBalance` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `walletType` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "walletBalance",
DROP COLUMN "walletType";
