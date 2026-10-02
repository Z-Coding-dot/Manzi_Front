ALTER TABLE "properties" ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "review_notes" TEXT;
ALTER TABLE "reviews" ADD COLUMN "owner_response" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN "subject" TEXT NOT NULL DEFAULT '', ADD COLUMN "body" TEXT NOT NULL DEFAULT '', ADD COLUMN "assigned_to_id" TEXT, ADD COLUMN "response" TEXT;
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published');
CREATE TABLE "cms_pages" (
 "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "locale" "Language" NOT NULL, "title" TEXT NOT NULL, "body" TEXT NOT NULL, "status" "ContentStatus" NOT NULL DEFAULT 'draft', "seo_title" TEXT, "seo_description" TEXT, "updated_by" TEXT NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cms_pages_slug_locale_key" ON "cms_pages"("slug", "locale");
CREATE TABLE "cms_banners" (
 "id" TEXT NOT NULL, "locale" "Language" NOT NULL, "title" TEXT NOT NULL, "body" TEXT NOT NULL DEFAULT '', "image" TEXT, "link" TEXT, "property_id" TEXT, "sort_order" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT false, "starts_at" TIMESTAMP(3), "ends_at" TIMESTAMP(3), "updated_by" TEXT NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "cms_banners_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cms_banners_locale_active_idx" ON "cms_banners"("locale", "active");
CREATE TABLE "blog_posts" (
 "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "locale" "Language" NOT NULL, "title" TEXT NOT NULL, "body" TEXT NOT NULL, "cover_image" TEXT, "status" "ContentStatus" NOT NULL DEFAULT 'draft', "author_id" TEXT NOT NULL, "published_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "blog_posts_slug_locale_key" ON "blog_posts"("slug", "locale");
CREATE TABLE "platform_settings" ("key" TEXT NOT NULL, "value" JSONB NOT NULL, "updated_by" TEXT NOT NULL, "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key"));
