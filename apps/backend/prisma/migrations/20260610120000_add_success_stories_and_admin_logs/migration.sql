-- CreateTable
CREATE TABLE "success_stories" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "testimonial" TEXT NOT NULL,
    "photo_r2_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "success_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_action_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "success_stories_status_idx" ON "success_stories"("status");

-- CreateIndex
CREATE INDEX "admin_action_logs_admin_id_idx" ON "admin_action_logs"("admin_id");

-- AddForeignKey
ALTER TABLE "success_stories" ADD CONSTRAINT "success_stories_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
