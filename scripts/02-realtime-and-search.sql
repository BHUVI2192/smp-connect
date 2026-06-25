-- ============================================
-- SMP CONNECT — STEP 2: Realtime & Search Indexes
-- ============================================
-- Run this AFTER: npx prisma db push
-- (tables must exist before this script runs)
-- ============================================

-- ─── ENABLE REALTIME ON NOTIFICATIONS ──────────────────

-- Safely remove first if already added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE notifications;
  END IF;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─── FULL-TEXT SEARCH INDEXES (GIN) ────────────────────

CREATE INDEX IF NOT EXISTS idx_contacts_fts
  ON contacts USING GIN (
    to_tsvector('english',
      full_name || ' ' ||
      COALESCE(organization, '') || ' ' ||
      COALESCE(designation, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_complaints_fts
  ON complaints USING GIN (
    to_tsvector('english',
      subject || ' ' ||
      description || ' ' ||
      complainant_name
    )
  );

CREATE INDEX IF NOT EXISTS idx_letters_fts
  ON letters USING GIN (
    to_tsvector('english',
      subject || ' ' ||
      body || ' ' ||
      recipient_name
    )
  );

CREATE INDEX IF NOT EXISTS idx_dev_works_fts
  ON development_works USING GIN (
    to_tsvector('english',
      title || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(location, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_speeches_fts
  ON speech_storage USING GIN (
    to_tsvector('english',
      title || ' ' ||
      COALESCE(description, '')
    )
  );

-- ============================================
-- STEP 2 DONE!
--
-- Next: npm run db:seed
-- Then: npm run dev
-- ============================================
