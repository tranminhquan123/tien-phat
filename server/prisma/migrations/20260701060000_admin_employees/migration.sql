-- Extend Admin into the internal employee directory without deleting existing data.
DO $$ BEGIN
  CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AdminAuditAction" AS ENUM (
    'EMPLOYEE_CREATED',
    'EMPLOYEE_UPDATED',
    'EMPLOYEE_DISABLED',
    'EMPLOYEE_REACTIVATED',
    'EMPLOYEE_PASSWORD_RESET',
    'EMPLOYEE_REASSIGNED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Admin"
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "role" "AdminRole" NOT NULL DEFAULT 'STAFF',
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "authVersion" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email");
CREATE INDEX IF NOT EXISTS "Admin_role_isActive_idx" ON "Admin"("role", "isActive");
CREATE INDEX IF NOT EXISTS "Admin_deletedAt_idx" ON "Admin"("deletedAt");

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorAdminId" TEXT NOT NULL,
  "targetAdminId" TEXT,
  "action" "AdminAuditAction" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminAuditLog_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AdminAuditLog_targetAdminId_fkey" FOREIGN KEY ("targetAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorAdminId_createdAt_idx" ON "AdminAuditLog"("actorAdminId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetAdminId_createdAt_idx" ON "AdminAuditLog"("targetAdminId", "createdAt");

-- Preserve the current administrator as the first OWNER.
UPDATE "Admin"
SET "role" = 'OWNER'
WHERE "id" = (
  SELECT "id"
  FROM "Admin"
  WHERE "deletedAt" IS NULL
  ORDER BY "createdAt" ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM "Admin"
  WHERE "role" = 'OWNER' AND "isActive" = true AND "deletedAt" IS NULL
);
