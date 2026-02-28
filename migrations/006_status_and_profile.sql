-- Campusly: Status Updates + Profile Views
-- Run in InsForge SQL editor

-- Status updates: photo, video, audio, note, thought with visibility control
CREATE TABLE IF NOT EXISTS user_status_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'audio', 'note', 'thought')),
    content TEXT,
    media_url TEXT,
    visibility TEXT DEFAULT 'followers' CHECK (visibility IN ('followers', 'individual')),
    visible_to UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_user_status_user ON user_status_updates (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_status_expires ON user_status_updates (expires_at);

ALTER TABLE user_status_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY us_select ON user_status_updates FOR SELECT USING (
    user_id = auth.uid()
    OR (visibility = 'followers' AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE (f.user_id_1 = auth.uid() AND f.user_id_2 = user_status_updates.user_id)
           OR (f.user_id_2 = auth.uid() AND f.user_id_1 = user_status_updates.user_id)
    ))
    OR (visibility = 'individual' AND auth.uid() = ANY(visible_to))
);
CREATE POLICY us_insert ON user_status_updates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY us_delete ON user_status_updates FOR DELETE USING (user_id = auth.uid());
