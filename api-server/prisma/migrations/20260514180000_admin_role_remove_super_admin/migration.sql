-- Remove SUPER_ADMIN from AdminRole; map existing rows to ADMIN.

CREATE TYPE "AdminRole_new" AS ENUM ('ADMIN', 'MANAGER');

UPDATE "admin_users" SET "role" = 'ADMIN' WHERE "role"::text = 'SUPER_ADMIN';

ALTER TABLE "admin_users" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "admin_users" ALTER COLUMN "role" TYPE "AdminRole_new" USING (
  CASE "role"::text
    WHEN 'ADMIN' THEN 'ADMIN'::"AdminRole_new"
    WHEN 'MANAGER' THEN 'MANAGER'::"AdminRole_new"
    ELSE 'MANAGER'::"AdminRole_new"
  END
);

ALTER TABLE "admin_users" ALTER COLUMN "role" SET DEFAULT 'MANAGER'::"AdminRole_new";

DROP TYPE "AdminRole";

ALTER TYPE "AdminRole_new" RENAME TO "AdminRole";

ALTER TABLE "admin_users" ALTER COLUMN "role" SET DEFAULT 'MANAGER'::"AdminRole";
