-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "destination_city" TEXT NOT NULL,
    "destination_country" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "accommodation_budget" TEXT,
    "course_budget" TEXT,
    "english_level" TEXT,
    "arrival_date" TEXT,
    "has_unread_notifications" BOOLEAN NOT NULL DEFAULT false,
    "notification_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
