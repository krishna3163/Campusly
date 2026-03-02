-- Campusly Production Database Patch
-- Version: 1.0.1
-- Description: Adds support for Story Reactions and Gamification (XP)

-- 1. Create Story Reactions Table
CREATE TABLE IF NOT EXISTS story_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('emoji', 'reply')),
    emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create XP Events Table
CREATE TABLE IF NOT EXISTS xp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    xp_amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update Stories Table for View Tracking
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stories' AND column_name='view_count') THEN
        ALTER TABLE stories ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Enable RLS for new tables
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

-- 5. Public Access Policies (Sample)
CREATE POLICY "Public read for story reactions" ON story_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated insert for story reactions" ON story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own XP events access" ON xp_events FOR SELECT USING (auth.uid() = user_id);
