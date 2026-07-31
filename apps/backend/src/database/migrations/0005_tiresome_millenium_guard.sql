CREATE TYPE "public"."role" AS ENUM('user', 'super_admin', 'account_manager', 'reviewer', 'designer');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING (
  CASE "role"::text
    WHEN 'client' THEN 'user'::"public"."role"
    ELSE "role"::text::"public"."role"
  END
);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';