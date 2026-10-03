ALTER TABLE "users"
 ADD COLUMN "avatar" TEXT,
 ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "console_preferences" JSONB NOT NULL DEFAULT '{}';
