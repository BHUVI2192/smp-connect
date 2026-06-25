-- ============================================
-- SMP CONNECT — Enterprise Schema Upgrade
-- Run AFTER existing schema is in place
-- ============================================

-- ─── LETTER SYSTEM UPGRADES ────────────────────────────

-- Add version history and rejection fields to letters
ALTER TABLE letters ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS rejected_reason TEXT;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE letters ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Letter version history table
CREATE TABLE IF NOT EXISTS letter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  version INT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_designation TEXT,
  recipient_address TEXT,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_letter_versions_letter ON letter_versions(letter_id);

-- ─── COMPLAINT SYSTEM UPGRADES ─────────────────────────

-- Complaint internal notes
CREATE TABLE IF NOT EXISTS complaint_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_internal BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_complaint_notes ON complaint_notes(complaint_id);

-- Complaint timeline/activity
CREATE TABLE IF NOT EXISTS complaint_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  performed_by TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_activities ON complaint_activities(complaint_id);

-- Add soft delete and internal fields
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

-- ─── CONTACT SYSTEM UPGRADES ──────────────────────────

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- ─── DEVELOPMENT WORK UPGRADES ────────────────────────

-- Add media tagging (BEFORE/DURING/AFTER)
ALTER TABLE development_work_media ADD COLUMN IF NOT EXISTS phase VARCHAR(20) DEFAULT 'DURING';
ALTER TABLE development_work_media ADD COLUMN IF NOT EXISTS uploaded_by TEXT;

-- Financial tracking
ALTER TABLE development_works ADD COLUMN IF NOT EXISTS budget_used FLOAT DEFAULT 0;
ALTER TABLE development_works ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE development_works ADD COLUMN IF NOT EXISTS progress_pct INT DEFAULT 0;

-- ─── DAY BOOK UPGRADES ───────────────────────────────

ALTER TABLE day_book_entries ADD COLUMN IF NOT EXISTS key_decisions TEXT;
ALTER TABLE day_book_entries ADD COLUMN IF NOT EXISTS issues TEXT;
ALTER TABLE day_book_entries ADD COLUMN IF NOT EXISTS actions TEXT;
ALTER TABLE day_book_entries ADD COLUMN IF NOT EXISTS linked_event_id UUID;
ALTER TABLE day_book_entries ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- ─── E-SIGN CONFIGURATION ─────────────────────────────

CREATE TABLE IF NOT EXISTS signature_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  signature_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signature_config ON signature_config(user_id);

-- ============================================
-- Done! Run: npx prisma db pull && npx prisma generate
-- Or update schema.prisma manually and push
-- ============================================
