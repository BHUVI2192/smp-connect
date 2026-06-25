-- ============================================
-- SMP CONNECT — STEP 1: Auth & Storage Setup
-- ============================================
-- Run this FIRST in Supabase SQL Editor
-- BEFORE running: npx prisma db push
-- ============================================

-- ─── CLEAN UP (safe to re-run) ─────────────────────────

-- Remove existing identities for these emails
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('mp@smp.com', 'pa@smp.com', 'staff@smp.com')
);

-- Also remove by fixed UUIDs in case emails changed
DELETE FROM auth.identities WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- Remove existing auth users
DELETE FROM auth.users WHERE email IN ('mp@smp.com', 'pa@smp.com', 'staff@smp.com');
DELETE FROM auth.users WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- ─── CREATE MP USER ────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role,
  created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'mp@smp.com',
  crypt('Mp@123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Hon. Member of Parliament","role":"MP"}',
  'authenticated', 'authenticated',
  NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'mp@smp.com',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'mp@smp.com'),
  'email',
  NOW(), NOW(), NOW()
);

-- ─── CREATE PA USER ────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role,
  created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'pa@smp.com',
  crypt('Pa@123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Personal Assistant","role":"PA"}',
  'authenticated', 'authenticated',
  NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  'pa@smp.com',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'pa@smp.com'),
  'email',
  NOW(), NOW(), NOW()
);

-- ─── CREATE STAFF USER ─────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role,
  created_at, updated_at, confirmation_token, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'staff@smp.com',
  crypt('Staff@123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Office Staff Member","role":"STAFF"}',
  'authenticated', 'authenticated',
  NOW(), NOW(), '', ''
);

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003',
  'staff@smp.com',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000003', 'email', 'staff@smp.com'),
  'email',
  NOW(), NOW(), NOW()
);

-- ─── STORAGE BUCKETS ───────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;

-- ─── STORAGE POLICIES ──────────────────────────────────
-- Drop first so this script is re-runnable

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated reads"
  ON storage.objects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated updates"
  ON storage.objects FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated deletes"
  ON storage.objects FOR DELETE TO authenticated USING (true);

-- ============================================
-- STEP 1 DONE!
-- 
-- Next steps:
--   1. npm install
--   2. npx prisma generate
--   3. npx prisma db push        ← creates all tables
--   4. Run STEP 2 SQL below      ← realtime + search indexes
--   5. npm run db:seed            ← seeds data
-- ============================================
