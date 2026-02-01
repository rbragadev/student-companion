/*
  Warnings:

  - You are about to drop the column `accommodation_budget` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `arrival_date` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `course_budget` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `destination_city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `destination_country` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `english_level` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `has_unread_notifications` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `notification_count` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - Added the required column `destination` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "accommodation_budget",
DROP COLUMN "arrival_date",
DROP COLUMN "course_budget",
DROP COLUMN "created_at",
DROP COLUMN "destination_city",
DROP COLUMN "destination_country",
DROP COLUMN "english_level",
DROP COLUMN "first_name",
DROP COLUMN "has_unread_notifications",
DROP COLUMN "last_name",
DROP COLUMN "notification_count",
DROP COLUMN "updated_at",
ADD COLUMN     "arrivalDate" TEXT,
ADD COLUMN     "budget" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "destination" JSONB NOT NULL,
ADD COLUMN     "englishLevel" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "hasUnreadNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "notificationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
