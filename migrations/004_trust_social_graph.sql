-- ============================================================
-- CAMPUSLY DATABASE MIGRATION v4.0
-- Trust, Reporting & Social Graph Expansion
-- Run AFTER 003_messaging_groups_upgrade.sql
-- PRESERVES all existing tables
-- ============================================================

-- ====================================================================
-- SECTION 1: BUG REPORTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    steps TEXT,
    screenshot_url TEXT,
    device_info JSONB DEFAULT '{}',
    app_version TEXT DEFAULT '0.1.0',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'closed')),
    admin_response TEXT,
    responded_by UUID REFERENCES profiles(id),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- SECTION 2: ERROR LOGS (auto-reporting)
-- ====================================================================

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    device_info JSONB DEFAULT '{}',
    last_action TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- SECTION 3: FRIEND REQUESTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    receiver_id UUID NOT NULL REFERENCES profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- ====================================================================
-- SECTION 4: FRIENDSHIPS (accepted pairs)
-- ====================================================================

CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES profiles(id),
    user_id_2 UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id_1, user_id_2),
    CHECK (user_id_1 < user_id_2)
);

-- ====================================================================
-- SECTION 5: USER SUGGESTIONS TRACKING
-- ====================================================================

CREATE TABLE IF NOT EXISTS user_suggestion_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    suggested_user_id UUID NOT NULL REFERENCES profiles(id),
    action TEXT NOT NULL CHECK (action IN ('dismissed', 'connected', 'followed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, suggested_user_id)
);

-- Track onboarding completion
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friend_count INTEGER DEFAULT 0;

-- ====================================================================
-- INDEXES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports (status);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests (sender_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships (user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships (user_id_2);
CREATE INDEX IF NOT EXISTS idx_user_suggestions ON user_suggestion_actions (user_id);

-- ====================================================================
-- ROW LEVEL SECURITY
-- ====================================================================

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY br_select ON bug_reports FOR SELECT USING (
    user_id = auth.uid() OR auth.uid() = 'db98f974-752b-4f66-a9ed-1dd35fcfbb93'::uuid
);
CREATE POLICY br_insert ON bug_reports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY br_update ON bug_reports FOR UPDATE USING (
    user_id = auth.uid() OR auth.uid() = 'db98f974-752b-4f66-a9ed-1dd35fcfbb93'::uuid
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY el_insert ON error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY el_select ON error_logs FOR SELECT USING (
    user_id = auth.uid() OR auth.uid() = 'db98f974-752b-4f66-a9ed-1dd35fcfbb93'::uuid
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY fr_select ON friend_requests FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
);
CREATE POLICY fr_insert ON friend_requests FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY fr_update ON friend_requests FOR UPDATE USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY fs_select ON friendships FOR SELECT USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
);
CREATE POLICY fs_insert ON friendships FOR INSERT WITH CHECK (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid()
);

ALTER TABLE user_suggestion_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY usa_select ON user_suggestion_actions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY usa_insert ON user_suggestion_actions FOR INSERT WITH CHECK (user_id = auth.uid());

-- ====================================================================
-- REALTIME
-- ====================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE bug_reports;
