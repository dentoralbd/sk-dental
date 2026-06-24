-- Add patient_code to patients for human-friendly unique IDs
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS patient_code TEXT;

-- Backfill existing patients with a unique code based on creation order
WITH numbered_patients AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS row_num
  FROM patients
  WHERE patient_code IS NULL
)
UPDATE patients
SET patient_code = 'PT-' || LPAD(numbered_patients.row_num::text, 5, '0')
FROM numbered_patients
WHERE patients.id = numbered_patients.id;

-- Ensure future records always have a unique patient_code
CREATE SEQUENCE IF NOT EXISTS patient_code_seq START 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patients_patient_code_key'
  ) THEN
    ALTER TABLE patients
    ADD CONSTRAINT patients_patient_code_key UNIQUE (patient_code);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION generate_patient_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PT-' || LPAD(nextval('patient_code_seq')::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE patients
ALTER COLUMN patient_code SET DEFAULT generate_patient_code();

SELECT setval(
  'patient_code_seq',
  GREATEST(
    COALESCE((SELECT MAX(SUBSTRING(patient_code FROM 4)::integer) FROM patients WHERE patient_code ~ '^PT-[0-9]+$'), 0),
    COALESCE((SELECT last_value FROM patient_code_seq), 0)
  )
);
