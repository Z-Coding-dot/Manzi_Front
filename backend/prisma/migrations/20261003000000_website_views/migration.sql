CREATE TABLE "website_views" (
 "day" DATE NOT NULL,
 "path" VARCHAR(80) NOT NULL,
 "views" BIGINT NOT NULL DEFAULT 0,
 PRIMARY KEY ("day", "path")
);
