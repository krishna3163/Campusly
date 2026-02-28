-- ============================================================
-- CAMPUSLY DATABASE MIGRATION v3.0
-- Messaging & Group System Upgrade
-- Run this in InsForge SQL editor AFTER 002_v2_enhancement.sql
-- PRESERVES all existing tables, EXTENDS schema cleanly
-- ============================================================

-- ====================================================================
-- SECTION 1: GROUP ASSIGNMENTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS group_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    is_important BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track individual member completion status
CREATE TABLE IF NOT EXISTS group_assignment_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES group_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, user_id)
);

-- Reminder scheduler log (prevents duplicate reminders)
CREATE TABLE IF NOT EXISTS assignment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES group_assignments(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '2h', 'overdue')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, reminder_type)
);

-- ====================================================================
-- SECTION 2: GROUP EVENTS (Test / Exam / Seminar / Class)
-- ====================================================================

CREATE TABLE IF NOT EXISTS group_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('test', 'exam', 'seminar', 'class', 'workshop', 'deadline')),
    title TEXT NOT NULL,
    description TEXT,
    syllabus_coverage TEXT,
    revision_resources JSONB DEFAULT '[]',
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event reminders log
CREATE TABLE IF NOT EXISTS event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES group_events(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('1d', '1h', '15m')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, reminder_type)
);

-- ====================================================================
-- SECTION 3: ROLE-BASED GROUP PERMISSIONS
-- ====================================================================

CREATE TABLE IF NOT EXISTS group_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    role TEXT NOT NULL CHECK (role IN (
        'owner', 'admin', 'co_admin',
        'class_representative', 'placement_coordinator',
        'moderator', 'member'
    )),
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Permission definitions (reference table, populated once)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission TEXT NOT NULL,
    UNIQUE(role, permission)
);

-- Seed default permissions
INSERT INTO role_permissions (role, permission) VALUES
    ('owner', 'delete_group'), ('owner', 'assign_roles'), ('owner', 'remove_admins'),
    ('owner', 'add_assignments'), ('owner', 'add_events'), ('owner', 'pin_messages'),
    ('owner', 'remove_members'), ('owner', 'moderate_chat'), ('owner', 'post_updates'),
    ('owner', 'delete_messages'), ('owner', 'warn_users'), ('owner', 'manage_settings'),
    ('admin', 'add_assignments'), ('admin', 'add_events'), ('admin', 'pin_messages'),
    ('admin', 'remove_members'), ('admin', 'moderate_chat'), ('admin', 'post_updates'),
    ('admin', 'delete_messages'), ('admin', 'warn_users'),
    ('co_admin', 'moderate_chat'), ('co_admin', 'add_events'), ('co_admin', 'delete_messages'),
    ('class_representative', 'post_updates'), ('class_representative', 'add_assignments'),
    ('placement_coordinator', 'post_updates'), ('placement_coordinator', 'add_events'),
    ('moderator', 'delete_messages'), ('moderator', 'warn_users')
ON CONFLICT (role, permission) DO NOTHING;

-- ====================================================================
-- SECTION 4: MESSAGE REACTIONS
-- ====================================================================

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- ====================================================================
-- SECTION 5: ENHANCED MESSAGE TYPES
-- ====================================================================

-- Extend message type enum possibilities
-- The existing `type` column on messages is TEXT, so we just document the new values:
-- text | image | video | gif | voice | file | sticker | contact | location | audio | poll | link | system
-- No schema change needed; the TEXT column already supports arbitrary values.

-- Media metadata cache for local-first compressed previews
CREATE TABLE IF NOT EXISTS media_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    original_url TEXT,
    compressed_url TEXT,
    thumbnail_url TEXT,
    file_size_original BIGINT,
    file_size_compressed BIGINT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,
    encryption_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- SECTION 6: SCHEDULED MESSAGES
-- ====================================================================

CREATE TABLE IF NOT EXISTS scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    attachments JSONB DEFAULT '[]',
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- SECTION 7: STICKER SYSTEM
-- ====================================================================

CREATE TABLE IF NOT EXISTS sticker_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    author TEXT,
    thumbnail_url TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_campus_official BOOLEAN DEFAULT FALSE,
    campus_id UUID REFERENCES campuses(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
    emoji_tag TEXT,
    image_url TEXT NOT NULL,
    width INTEGER DEFAULT 512,
    height INTEGER DEFAULT 512,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sticker_recents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    sticker_id UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, sticker_id)
);

-- ====================================================================
-- SECTION 9: COMMUNITY SYSTEM
-- ====================================================================

CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    campus_id UUID REFERENCES campuses(id),
    announcement_channel_id UUID REFERENCES conversations(id),
    created_by UUID NOT NULL REFERENCES profiles(id),
    max_groups INTEGER DEFAULT 50,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(community_id, group_id)
);

CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

-- ====================================================================
-- SECTION 10: CALL SYSTEM
-- ====================================================================

CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('voice', 'video', 'group_voice', 'group_video')),
    status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
    initiated_by UUID NOT NULL REFERENCES profiles(id),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    ice_servers JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT FALSE,
    is_camera_off BOOLEAN DEFAULT FALSE,
    is_screen_sharing BOOLEAN DEFAULT FALSE,
    UNIQUE(call_id, user_id)
);

-- ====================================================================
-- SECTION 11: GROUP STABILITY — JOIN REQUESTS & INVITES
-- ====================================================================

CREATE TABLE IF NOT EXISTS group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance conversations for pinned messages and broadcast mode
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pinned_message_ids UUID[] DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS join_approval_required BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS invite_link_code TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);

-- ====================================================================
-- SECTION 12: PRACTICE MODE (MCQ Tests)
-- ====================================================================

CREATE TABLE IF NOT EXISTS practice_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    time_limit_minutes INTEGER DEFAULT 30,
    created_by UUID NOT NULL REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES practice_tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_option INTEGER NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS practice_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES practice_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    answers JSONB NOT NULL DEFAULT '{}',
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(test_id, user_id)
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_group_assignments_group ON group_assignments (group_id, due_date);
CREATE INDEX IF NOT EXISTS idx_group_assignments_creator ON group_assignments (created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_completions_assignment ON group_assignment_completions (assignment_id);
CREATE INDEX IF NOT EXISTS idx_group_events_group ON group_events (group_id, event_date);
CREATE INDEX IF NOT EXISTS idx_group_roles_group ON group_roles (group_id, role);
CREATE INDEX IF NOT EXISTS idx_group_roles_user ON group_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions (message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages (status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user ON scheduled_messages (user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_calls_conversation ON calls (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_participants_call ON call_participants (call_id);
CREATE INDEX IF NOT EXISTS idx_community_groups_community ON community_groups (community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members (community_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_group ON group_join_requests (group_id, status);
CREATE INDEX IF NOT EXISTS idx_practice_tests_group ON practice_tests (group_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_test ON practice_attempts (test_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_media_cache_message ON media_cache (message_id);
CREATE INDEX IF NOT EXISTS idx_stickers_pack ON stickers (pack_id, sort_order);

-- ====================================================================
-- ROW LEVEL SECURITY
-- ====================================================================

-- Group Assignments: members of the group can read; creators/admins can write
ALTER TABLE group_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ga_select ON group_assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = group_assignments.group_id AND user_id = auth.uid())
);
CREATE POLICY ga_insert ON group_assignments FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY ga_update ON group_assignments FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY ga_delete ON group_assignments FOR DELETE USING (created_by = auth.uid());

-- Group Assignment Completions
ALTER TABLE group_assignment_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY gac_select ON group_assignment_completions FOR SELECT USING (true);
CREATE POLICY gac_insert ON group_assignment_completions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY gac_delete ON group_assignment_completions FOR DELETE USING (user_id = auth.uid());

-- Group Events
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY ge_select ON group_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = group_events.group_id AND user_id = auth.uid())
);
CREATE POLICY ge_insert ON group_events FOR INSERT WITH CHECK (created_by = auth.uid());

-- Group Roles
ALTER TABLE group_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY gr_select ON group_roles FOR SELECT USING (true);
CREATE POLICY gr_insert ON group_roles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_roles WHERE group_id = group_roles.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Message Reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY mr_select ON message_reactions FOR SELECT USING (true);
CREATE POLICY mr_insert ON message_reactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY mr_delete ON message_reactions FOR DELETE USING (user_id = auth.uid());

-- Scheduled Messages
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY sm_select ON scheduled_messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY sm_insert ON scheduled_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY sm_update ON scheduled_messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY sm_delete ON scheduled_messages FOR DELETE USING (user_id = auth.uid());

-- Calls
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY calls_select ON calls FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = calls.conversation_id AND user_id = auth.uid())
);
CREATE POLICY calls_insert ON calls FOR INSERT WITH CHECK (initiated_by = auth.uid());

-- Communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY comm_select ON communities FOR SELECT USING (true);
CREATE POLICY comm_insert ON communities FOR INSERT WITH CHECK (created_by = auth.uid());

-- Community Members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_select ON community_members FOR SELECT USING (true);
CREATE POLICY cm_insert ON community_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- Practice Tests
ALTER TABLE practice_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY pt_select ON practice_tests FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = practice_tests.group_id AND user_id = auth.uid())
);
CREATE POLICY pt_insert ON practice_tests FOR INSERT WITH CHECK (created_by = auth.uid());

-- Practice Questions
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY pq_select ON practice_questions FOR SELECT USING (true);

-- Practice Attempts
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY pa_select ON practice_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY pa_insert ON practice_attempts FOR INSERT WITH CHECK (user_id = auth.uid());

-- Sticker packs & stickers: public read
ALTER TABLE sticker_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY sp_select ON sticker_packs FOR SELECT USING (true);
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY st_select ON stickers FOR SELECT USING (true);

-- Group Join Requests
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY gjr_select ON group_join_requests FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM group_roles WHERE group_id = group_join_requests.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'co_admin')
    )
);
CREATE POLICY gjr_insert ON group_join_requests FOR INSERT WITH CHECK (user_id = auth.uid());

-- Group Invite Links
ALTER TABLE group_invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY gil_select ON group_invite_links FOR SELECT USING (true);

-- Media Cache
ALTER TABLE media_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY mc_select ON media_cache FOR SELECT USING (true);

-- ====================================================================
-- REALTIME SUBSCRIPTIONS (enable for key tables)
-- ====================================================================

-- Enable realtime for interactive tables
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE group_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE group_assignment_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE group_events;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE group_join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_messages;
