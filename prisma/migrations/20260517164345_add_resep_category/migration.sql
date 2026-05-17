/*
  Warnings:

  - Added the required column `resepCategory` to the `Resep` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Resep" ADD COLUMN     "resepCategory" VARCHAR(50) NOT NULL;
