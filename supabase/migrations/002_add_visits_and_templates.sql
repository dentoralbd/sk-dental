-- Patient visits table
CREATE TABLE IF NOT EXISTS patient_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  chief_complaint TEXT,
  examination_findings TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication templates table (for memory/autocomplete)
CREATE TABLE IF NOT EXISTS medication_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investigation templates table (for memory/autocomplete)
CREATE TABLE IF NOT EXISTS investigation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add investigations column to prescriptions if not exists
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS investigations JSONB DEFAULT '[]';
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- Add appointment_id to treatments if not exists
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- Add appointment_id to invoices if not exists
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_visits_patient ON patient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_date ON patient_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_medication_templates_name ON medication_templates(name);
CREATE INDEX IF NOT EXISTS idx_investigation_templates_name ON investigation_templates(name);
