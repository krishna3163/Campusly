-- ============================================================
-- CAMPUSLY DATABASE MIGRATION v5.0 - System Refactor
-- Run this in InsForge SQL editor
-- PRESERVES all existing tables, EXTENDS schema cleanly
-- ============================================================

-- ====== SECTION 1: MESSAGES (ensure all columns exist) ======
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments_metadata JSONB DEFAULT '[]';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sending','sent','delivered','read','failed'));

-- ====== SECTION 2: PLACEMENT JOBS ======
CREATE TABLE IF NOT EXISTS placement_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID REFERENCES campuses(id),
    author_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    description TEXT,
    apply_link TEXT,
    photo_url TEXT,
    branch_eligibility TEXT[] DEFAULT '{}',
    hashtags TEXT[] DEFAULT '{}',
    start_date DATE,
    last_date DATE,
    experience_required TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_jobs_branch ON placement_jobs USING GIN (branch_eligibility);
CREATE INDEX IF NOT EXISTS idx_placement_jobs_start ON placement_jobs (start_date DESC);
CREATE INDEX IF NOT EXISTS idx_placement_jobs_campus ON placement_jobs (campus_id, created_at DESC);

-- ====== SECTION 3: RESUMES ======
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
    full_name TEXT,
    college TEXT,
    branch TEXT,
    semester INTEGER,
    education_10th JSONB DEFAULT '{}',
    education_12th JSONB DEFAULT '{}',
    cgpa NUMERIC,
    skills JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    career_goal TEXT,
    experience JSONB DEFAULT '[]',
    linkedin_url TEXT,
    github_url TEXT,
    leetcode_url TEXT,
    raw_content TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes (user_id);

-- ====== SECTION 4: RESUME_SKILLS (for denormalized skill search) ======
CREATE TABLE IF NOT EXISTS resume_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    skill_type TEXT NOT NULL CHECK (skill_type IN ('language','tool','framework','other')),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_skills_resume ON resume_skills (resume_id);

-- ====== SECTION 5: USER_TAGS (for placement interest, branch, etc) ======
CREATE TABLE IF NOT EXISTS user_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    tag_type TEXT NOT NULL CHECK (tag_type IN ('branch','placement_interest','skill','custom')),
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tags_user ON user_tags (user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_value ON user_tags (tag_type, value);

-- ====== SECTION 6: REFERRALS (if not exists) ======
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES profiles(id),
    invited_user_id UUID NOT NULL REFERENCES profiles(id),
    campus_id UUID NOT NULL REFERENCES campuses(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(invited_user_id)
);

-- ====== SECTION 7: CAMPUS_ROLES (if not exists) ======
CREATE TABLE IF NOT EXISTS campus_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    campus_id UUID NOT NULL REFERENCES campuses(id),
    role TEXT NOT NULL CHECK (role IN ('ambassador','moderator','admin')),
    granted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, campus_id, role)
);

-- ====== SECTION 8: REPORTS (if not exists) ======
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id),
    content_type TEXT NOT NULL CHECK (content_type IN ('post','comment','message','profile')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed','actioned')),
    reviewed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====== SECTION 9: CONTENT_FLAGS (if not exists) ======
CREATE TABLE IF NOT EXISTS content_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    flag_type TEXT NOT NULL CHECK (flag_type IN ('profanity','spam','auto_hidden','manual_review')),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====== SECTION 10: INDEXES (ensure all exist) ======
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_campus_created ON posts (campus_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);
