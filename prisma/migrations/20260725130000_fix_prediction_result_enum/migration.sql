-- The initial migration shipped with a stale enum ('TUMOR_DETECTED') that
-- doesn't match the model's actual classes. Postgres can't drop/rename enum
-- values in place, so we swap in a new type and repoint the column at it.

-- Anything still labeled 'TUMOR_DETECTED' (shouldn't exist on a fresh DB,
-- but just in case) is remapped to 'INCONCLUSIVE' rather than left dangling.
UPDATE "predictions" SET "result" = 'INCONCLUSIVE' WHERE "result" = 'TUMOR_DETECTED';

CREATE TYPE "PredictionResult_new" AS ENUM ('GLIOMA', 'MENINGIOMA', 'PITUITARY', 'NO_TUMOR', 'INCONCLUSIVE');

ALTER TABLE "predictions"
  ALTER COLUMN "result" TYPE "PredictionResult_new"
  USING ("result"::text::"PredictionResult_new");

DROP TYPE "PredictionResult";
ALTER TYPE "PredictionResult_new" RENAME TO "PredictionResult";
