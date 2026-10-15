-- ============================================================
-- West Mun Venue Manager - Supabase PostgreSQL & Real-time Setup
-- Black & Gold Edition: 10 Roles & Password Authentication
-- ============================================================

-- 1. Create Guests Manifest Table
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ticket_id TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Admission',
    table_or_seat TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Checked-In')),
    checked_in_time TIMESTAMPTZ,
    checked_in_by TEXT,
    checked_in_gate TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_guests_ticket_id ON public.guests (LOWER(ticket_id));
CREATE INDEX IF NOT EXISTS idx_guests_status ON public.guests (status);
CREATE INDEX IF NOT EXISTS idx_guests_category ON public.guests (category);

-- 2. Staff Accounts Table with 10 Distinct Roles & Password
CREATE TABLE IF NOT EXISTS public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'volunteers' CHECK (role IN (
        'volunteers',
        'security',
        'media_and_press',
        'marketing',
        'hr',
        'ceremony_director',
        'pr',
        'secretary',
        'doc_department',
        'super_admin'
    )),
    access_key TEXT NOT NULL,
    assigned_gate TEXT NOT NULL,
    can_scan BOOLEAN DEFAULT TRUE,
    can_manual_check_in BOOLEAN DEFAULT FALSE,
    can_revoke_check_in BOOLEAN DEFAULT FALSE,
    can_manage_staff BOOLEAN DEFAULT FALSE,
    can_export_data BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Check-in Audit Logs Table
CREATE TABLE IF NOT EXISTS public.check_in_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    category TEXT NOT NULL,
    gate TEXT NOT NULL,
    scanner_name TEXT NOT NULL,
    log_type TEXT NOT NULL CHECK (log_type IN ('CHECK_IN', 'UNDO_CHECK_IN', 'DENIED_ATTEMPT')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_in_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_members;

-- 5. Row Level Security
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated staff" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Enable update for door check-ins" ON public.guests FOR UPDATE USING (true);
CREATE POLICY "Enable insert logs for door scanners" ON public.check_in_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable full access for admins" ON public.guests FOR ALL USING (true);
