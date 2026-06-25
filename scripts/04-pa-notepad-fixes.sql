-- ============================================
-- SMP CONNECT — STEP 4: PA Notepad & Storage Fixes
-- ============================================
-- Run this in Supabase SQL Editor to resolve RLS violations
-- ============================================

-- 1. Ensure RLS is enabled on plan_today_events
ALTER TABLE public.plan_today_events ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.plan_today_events;
DROP POLICY IF EXISTS "PA can manage their own events" ON public.plan_today_events;
DROP POLICY IF EXISTS "Staff can read finalized events" ON public.plan_today_events;

-- 3. Create robust policies for plan_today_events
CREATE POLICY "PA can manage their own events"
  ON public.plan_today_events FOR ALL
  TO authenticated
  USING (auth.uid()::text = created_by)
  WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Staff can read finalized events"
  ON public.plan_today_events FOR SELECT
  TO authenticated
  USING (is_finalized = true OR auth.uid()::text = created_by);

-- 4. Storage Fixes - Robust policies for the 'documents' bucket
-- These ensure PA role can upload despite existing broad policies

DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow authenticated updates to documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents');

-- 5. Explicitly grant permissions to the authenticated role for the table
GRANT ALL ON public.plan_today_events TO authenticated;
GRANT ALL ON public.plan_today_events TO service_role;
