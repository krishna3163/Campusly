-- ============================================================
-- CAMPUSLY DATABASE MIGRATION v2.0
-- Run this in InsForge SQL editor
-- PRESERVES all existing tables, EXTENDS schema cleanly
-- ============================================================

-- ====== SECTION 1: ENHANCE MESSAGES TABLE ======

ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments_metadata JSONB DEFAULT '[]';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'));

-- ====== SECTION 2: ENHANCE PROFILES TABLE ======

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_last_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exam_mode BOOLEAN DEFAULT FALSE;

-- ====== SECTION 3: ENHANCE POSTS TABLE ======

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- ====== SECTION 4: ENHANCE INTERVIEW EXPERIENCES TABLE ======

ALTER TABLE interview_experiences ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id);
ALTER TABLE interview_experiences ADD COLUMN IF NOT EXISTS batch_year INTEGER;
ALTER TABLE interview_experiences ADD COLUMN IF NOT EXISTS branch TEXT;

-- ====== SECTION 5: ENHANCE EXAMS TABLE ======

ALTER TABLE exams ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id);

-- ====== SECTION 6: ENHANCE CAMPUSES TABLE ======

ALTER TABLE campuses ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}';

-- ====== SECTION 7: NEW TABLES ======

-- Reports table for content moderation
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'profile')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    reviewed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campus roles for moderation
CREATE TABLE IF NOT EXISTS campus_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    campus_id UUID NOT NULL REFERENCES campuses(id),
    role TEXT NOT NULL CHECK (role IN ('ambassador', 'moderator', 'admin')),
    granted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, campus_id, role)
);

-- Content flags for automated moderation
CREATE TABLE IF NOT EXISTS content_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message')),
    content_id UUID NOT NULL,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('profanity', 'spam', 'auto_hidden', 'manual_review')),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES profiles(id),
    invited_user_id UUID NOT NULL REFERENCES profiles(id),
    campus_id UUID NOT NULL REFERENCES campuses(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(invited_user_id)
);

-- XP events log
CREATE TABLE IF NOT EXISTS xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    action TEXT NOT NULL,
    xp_amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campus metrics for analytics
CREATE TABLE IF NOT EXISTS campus_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID NOT NULL REFERENCES campuses(id),
    date DATE NOT NULL,
    dau INTEGER DEFAULT 0,
    messages_count INTEGER DEFAULT 0,
    assignments_added INTEGER DEFAULT 0,
    feed_posts_count INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campus_id, date)
);

-- ====== SECTION 8: COMPOSITE INDEXES ======

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_campus_created ON posts (campus_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_user_due ON assignments (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_exams_campus_date ON exams (campus_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_campus_roles_user ON campus_roles (user_id, campus_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals (inviter_id);
CREATE INDEX IF NOT EXISTS idx_campus_metrics_campus_date ON campus_metrics (campus_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_interview_exp_filters ON interview_experiences (company, branch, batch_year, difficulty, result);
CREATE INDEX IF NOT EXISTS idx_profiles_campus_xp ON profiles (campus_id, xp DESC);

-- ====== SECTION 9: RLS POLICIES ======

-- Reports: users can insert their own reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_insert ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_select ON reports FOR SELECT USING (reporter_id = auth.uid() OR EXISTS (
    SELECT 1 FROM campus_roles WHERE user_id = auth.uid() AND role IN ('moderator', 'admin')
));

-- Campus roles: readable by all, managed by admins
ALTER TABLE campus_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY campus_roles_select ON campus_roles FOR SELECT USING (true);

-- XP events: users can only see their own
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY xp_events_select ON xp_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY xp_events_insert ON xp_events FOR INSERT WITH CHECK (user_id = auth.uid());

-- Referrals: users can see their own
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referrals_select ON referrals FOR SELECT USING (inviter_id = auth.uid() OR invited_user_id = auth.uid());
CREATE POLICY referrals_insert ON referrals FOR INSERT WITH CHECK (true);

-- Campus metrics: readable by campus members
ALTER TABLE campus_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY campus_metrics_select ON campus_metrics FOR SELECT USING (true);

-- Content flags: readable by moderators
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_flags_select ON content_flags FOR SELECT USING (EXISTS (
    SELECT 1 FROM campus_roles WHERE user_id = auth.uid() AND role IN ('moderator', 'admin')
));
