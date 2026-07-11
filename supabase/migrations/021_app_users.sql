-- App user accounts (doctor / operator) managed by the admin from the Admin zone.
-- The admin itself has no row here — it authenticates with the fixed app password.
-- Guarded with existence checks so it is safe to re-run against the live project.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'app_users' AND n.nspname = 'public'
  ) THEN
    CREATE TABLE public.app_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      role TEXT NOT NULL CHECK (role IN ('doctor', 'operator')),
      full_name TEXT NOT NULL,
      -- Normalized login identifier: lowercase email, or phone digits (optional leading +)
      identifier TEXT NOT NULL,
      -- PBKDF2-SHA256 (100k iterations, 256-bit), base64
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      -- {"can_delete":bool,"can_revert":bool,"can_edit_clinic_profile":bool,
      --  "pages":{"patients":bool,"appointments":bool,"treatments":bool,
      --           "prescriptions":bool,"billing":bool,"inventory":bool,"qr-search":bool}}
      permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_login_at TIMESTAMPTZ
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_app_users_identifier'
  ) THEN
    CREATE UNIQUE INDEX idx_app_users_identifier ON public.app_users (identifier);
  END IF;
END $$;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_users' AND policyname = 'Allow all on app_users'
  ) THEN
    CREATE POLICY "Allow all on app_users" ON public.app_users
      FOR ALL USING (true);
  END IF;
END $$;
