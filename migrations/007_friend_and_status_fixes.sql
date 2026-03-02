-- ============================================================
-- CAMPUSLY DATABASE MIGRATION v7.0
-- Friend System + Status Visibility + Feed Enhancements
-- PRIORITY: Fix broken systems
-- ============================================================

-- ====== SECTION 1: FRIEND SYSTEM ======

-- Ensure friend_requests exists with correct status
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Official friends table as requested
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- ====== SECTION 2: STATUS / STORIES ENHANCEMENTS ======

-- Status Views table
CREATE TABLE IF NOT EXISTS status_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(status_id, viewer_id)
);

-- Ensure stories table has visibility controls if missing
ALTER TABLE stories ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'friends' CHECK (visibility IN ('friends', 'close_friends', 'only_me', 'everyone'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_overlay_url TEXT;

-- ====== SECTION 3: CAMPUS FEED ENHANCEMENTS ======

-- Ensure posts table is fully equipped
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS repost_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS parent_post_id UUID REFERENCES posts(id); -- For Quote posts / Reposts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';

-- Repasts / Quote posts table
CREATE TABLE IF NOT EXISTS post_reposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    is_quote BOOLEAN DEFAULT FALSE,
    content TEXT, -- For quote posts
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id, is_quote)
);

-- Likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS post_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- ====== SECTION 4: INDEXES & PERFORMANCE ======

CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_status_views_status ON status_views(status_id);
CREATE INDEX IF NOT EXISTS idx_posts_trending ON posts(likes_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ====== SECTION 5: RLS POLICIES ======

-- Friends: users can only see their own friendship list
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY friends_select ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Status Views
ALTER TABLE status_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY sv_insert ON status_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY sv_select ON status_views FOR SELECT USING (auth.uid() = (SELECT author_id FROM stories WHERE id = status_id) OR auth.uid() = viewer_id);

-- Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY follows_policy ON follows FOR ALL USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- ====== SECTION 6: SCHEDULER (Placeholder for Edge Function documentation) ======
-- Logic for 24h cleanup:
-- DELETE FROM stories WHERE expires_at <= NOW();
