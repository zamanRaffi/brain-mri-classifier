DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'DoctorPredictionStatus'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "DoctorPredictionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW');
  END IF;
END
$$;

ALTER TABLE "predictions"
  ADD COLUMN "doctorStatus" "DoctorPredictionStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "doctorComment" TEXT,
  ADD COLUMN "reviewedBy" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);
