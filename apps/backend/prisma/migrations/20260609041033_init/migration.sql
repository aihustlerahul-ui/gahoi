-- CreateTable
CREATE TABLE "locations_country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" VARCHAR(2) NOT NULL,

    CONSTRAINT "locations_country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations_state" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "locations_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations_city" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "locations_city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gotras" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "gotras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "auth_provider" TEXT NOT NULL DEFAULT 'email_otp',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "tier" TEXT NOT NULL DEFAULT 'free',
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_requests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "profile_id" SERIAL NOT NULL,
    "gender" TEXT,
    "gotra" TEXT,
    "aakna" TEXT,
    "manglik_status" TEXT NOT NULL DEFAULT 'Non-Manglik',
    "marital_status" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "time_of_birth" TEXT,
    "height_cm" INTEGER,
    "complexion" TEXT,
    "mobile" TEXT,
    "living_city_id" INTEGER,
    "native_state" TEXT,
    "admin_status" TEXT NOT NULL DEFAULT 'pending',
    "profile_completeness_pct" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "about_me" TEXT,
    "country_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_education" (
    "profile_id" TEXT NOT NULL,
    "highest_degree" TEXT,
    "field_of_study" TEXT,
    "institution" TEXT,
    "completion_year" INTEGER,

    CONSTRAINT "profile_education_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "profile_occupation" (
    "profile_id" TEXT NOT NULL,
    "occupation_type" TEXT,
    "job_title" TEXT,
    "employer" TEXT,
    "annual_income_min" INTEGER,
    "annual_income_max" INTEGER,

    CONSTRAINT "profile_occupation_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "profile_family" (
    "profile_id" TEXT NOT NULL,
    "father_name" TEXT,
    "father_mobile" TEXT,
    "father_occupation" TEXT,
    "mother_name" TEXT,
    "mother_occupation" TEXT,
    "siblings" INTEGER,
    "family_type" TEXT,
    "family_status" TEXT,
    "home_address" TEXT,

    CONSTRAINT "profile_family_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "profile_partner_preferences" (
    "profile_id" TEXT NOT NULL,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "height_min_cm" INTEGER,
    "height_max_cm" INTEGER,
    "marital_status" TEXT[],
    "education_min" TEXT,
    "income_min" INTEGER,
    "manglik_preference" TEXT,
    "exclude_same_gotra" BOOLEAN NOT NULL DEFAULT true,
    "preferred_city_ids" INTEGER[],
    "preferred_countries" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_partner_preferences_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "profile_gallery" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "r2_key" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "admin_status" TEXT NOT NULL DEFAULT 'pending',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shortlists" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "shortlisted_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_views" (
    "id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "viewed_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_id" TEXT NOT NULL,
    "reason_code" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_candidates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "match_score" INTEGER NOT NULL,
    "kundli_score" INTEGER,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_hi" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price_inr" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "razorpay_order_id" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_country_name_key" ON "locations_country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "locations_country_iso2_key" ON "locations_country"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "gotras_name_key" ON "gotras"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "otp_requests_email_idx" ON "otp_requests"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_profile_id_key" ON "profiles"("profile_id");

-- CreateIndex
CREATE INDEX "profiles_gender_idx" ON "profiles"("gender");

-- CreateIndex
CREATE INDEX "profiles_gotra_idx" ON "profiles"("gotra");

-- CreateIndex
CREATE INDEX "idx_profiles_height" ON "profiles"("height_cm");

-- CreateIndex
CREATE INDEX "idx_profiles_city" ON "profiles"("living_city_id");

-- CreateIndex
CREATE INDEX "idx_profiles_marital" ON "profiles"("marital_status");

-- CreateIndex
CREATE INDEX "idx_profiles_manglik" ON "profiles"("manglik_status");

-- CreateIndex
CREATE INDEX "idx_profiles_status" ON "profiles"("admin_status");

-- CreateIndex
CREATE INDEX "idx_occupation_income" ON "profile_occupation"("annual_income_min", "annual_income_max");

-- CreateIndex
CREATE INDEX "idx_gallery_profile" ON "profile_gallery"("profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_interests_receiver" ON "interests"("receiver_id", "status");

-- CreateIndex
CREATE INDEX "idx_interests_sender" ON "interests"("sender_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "interests_sender_id_receiver_id_key" ON "interests"("sender_id", "receiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "shortlists_owner_id_shortlisted_id_key" ON "shortlists"("owner_id", "shortlisted_id");

-- CreateIndex
CREATE INDEX "profile_views_viewed_id_idx" ON "profile_views"("viewed_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_blocks_blocker_id_blocked_id_key" ON "profile_blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "match_candidates_user_id_match_score_idx" ON "match_candidates"("user_id", "match_score");

-- CreateIndex
CREATE UNIQUE INDEX "match_candidates_user_id_candidate_id_key" ON "match_candidates"("user_id", "candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_razorpay_order_id_key" ON "subscriptions"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_razorpay_payment_id_key" ON "subscriptions"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "locations_state" ADD CONSTRAINT "locations_state_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "locations_country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations_city" ADD CONSTRAINT "locations_city_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "locations_state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_requests" ADD CONSTRAINT "otp_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_living_city_id_fkey" FOREIGN KEY ("living_city_id") REFERENCES "locations_city"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "locations_country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_education" ADD CONSTRAINT "profile_education_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_occupation" ADD CONSTRAINT "profile_occupation_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_family" ADD CONSTRAINT "profile_family_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_partner_preferences" ADD CONSTRAINT "profile_partner_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_gallery" ADD CONSTRAINT "profile_gallery_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shortlists" ADD CONSTRAINT "shortlists_shortlisted_id_fkey" FOREIGN KEY ("shortlisted_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewed_id_fkey" FOREIGN KEY ("viewed_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_reports" ADD CONSTRAINT "profile_reports_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_blocks" ADD CONSTRAINT "profile_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_blocks" ADD CONSTRAINT "profile_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_candidates" ADD CONSTRAINT "match_candidates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
