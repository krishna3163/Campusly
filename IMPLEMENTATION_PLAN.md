# Campusly — Implementation Plan

## 🏗️ Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React + Vite + TypeScript | Cross-platform web app (PWA) |
| **Styling** | Tailwind CSS 3.4 | Rapid UI development with design tokens |
| **State Management** | Zustand + React Query | Local-first state + server sync |
| **Backend (BaaS)** | InsForge | Auth, DB, Realtime, Storage, AI, Functions |
| **Realtime** | InsForge WebSocket | Messaging, presence, typing indicators |
| **Local Storage** | IndexedDB (Dexie.js) | Offline-first media, messages, notes |
| **P2P Transfer** | WebRTC DataChannel | Direct file sharing between devices |
| **Voice/Video** | WebRTC MediaStream | Voice rooms, screen sharing |
| **PWA** | Service Workers + Workbox | Offline capability, push notifications |
| **Encryption** | Web Crypto API | E2E encrypted private chats |

### InsForge Backend Configuration

```
Base URL: https://tkjd4xnm.ap-southeast.insforge.app
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTQzNzh9.AZf-I0HrpTmCNjnbck3ptcLY01Anre-WUPo-xLyAna8
Auth: Email/Password + Google OAuth
AI Models: deepseek-v3.2, gpt-4o-mini, claude-sonnet-4.5, gemini-3-pro
```

---

## 1. Full Frontend Screen Hierarchy

```
📱 Campusly App
│
├── 🔐 Auth Flow
│   ├── SplashScreen
│   ├── OnboardingCarousel (3 slides)
│   ├── LoginScreen (Email/Google)
│   ├── SignUpScreen
│   ├── OTPVerificationScreen
│   ├── CampusSelectionScreen
│   └── ProfileSetupScreen (branch, semester, skills, interests)
│
├── 📱 Main App (Bottom Tab Navigation)
│   │
│   ├── 💬 Chats Tab
│   │   ├── ChatListScreen (1-to-1 + Groups)
│   │   ├── ChatScreen (messages, reactions, polls, voice notes)
│   │   ├── GroupInfoScreen
│   │   ├── NewChatScreen
│   │   ├── NewGroupScreen
│   │   ├── BroadcastChannelScreen
│   │   ├── MessageSearchScreen
│   │   └── BookmarkedMessagesScreen
│   │
│   ├── 🏠 Campus Tab (Feed)
│   │   ├── CampusFeedScreen
│   │   ├── CreatePostScreen
│   │   ├── PostDetailScreen (threaded comments)
│   │   ├── EventsScreen
│   │   ├── LostFoundScreen
│   │   ├── ConfessionsScreen
│   │   ├── MarketplaceScreen
│   │   └── HostelDiscussionsScreen
│   │
│   ├── 📚 Study Tab
│   │   ├── NotesVaultScreen (semester/subject folders)
│   │   ├── NoteViewerScreen
│   │   ├── AssignmentTrackerScreen
│   │   ├── ExamCountdownScreen
│   │   ├── TimetableScreen
│   │   ├── PYQRepositoryScreen
│   │   ├── StudyBuddyMatchScreen
│   │   ├── DSAGrindRoomScreen
│   │   ├── WhiteboardScreen
│   │   └── VoiceDoubtRoomScreen
│   │
│   ├── 💼 Placement Tab
│   │   ├── PlacementHubScreen
│   │   ├── InterviewExperiencesScreen
│   │   ├── ResumeReviewScreen
│   │   ├── ReferralExchangeScreen
│   │   ├── CompanyPrepChannelScreen
│   │   └── PlacementTrackerScreen
│   │
│   └── 👤 Profile Tab
│       ├── ProfileScreen
│       ├── EditProfileScreen
│       ├── SettingsScreen
│       ├── NotificationPrefsScreen
│       ├── PrivacyScreen
│       ├── StorageManagementScreen
│       ├── SeniorBadgesScreen
│       └── ReputationScreen
│
├── 📂 Modal Overlays
│   ├── MediaViewerModal
│   ├── PollCreatorModal
│   ├── VoiceNoteRecorderModal
│   ├── FilePickerModal
│   ├── P2PShareModal (QR + Hotspot)
│   ├── AISummarizeModal
│   └── ReportModal
│
└── 🔔 System Screens
    ├── NotificationCenterScreen
    ├── SearchGlobalScreen
    ├── MentorshipScreen
    ├── AskSeniorScreen
    └── CampusStoriesScreen
```

---

## 2. Navigation Architecture

```typescript
// React Router v6 structure
const routes = {
  // Public routes
  '/': SplashScreen,
  '/onboarding': OnboardingCarousel,
  '/login': LoginScreen,
  '/signup': SignUpScreen,
  '/verify': OTPVerificationScreen,
  '/setup/campus': CampusSelectionScreen,
  '/setup/profile': ProfileSetupScreen,

  // Protected routes (MainLayout with BottomTabs)
  '/app': MainLayout,
  '/app/chats': ChatListScreen,
  '/app/chats/:chatId': ChatScreen,
  '/app/chats/new': NewChatScreen,
  '/app/chats/group/new': NewGroupScreen,
  '/app/chats/bookmarks': BookmarkedMessagesScreen,
  '/app/chats/:chatId/info': GroupInfoScreen,

  '/app/campus': CampusFeedScreen,
  '/app/campus/post/new': CreatePostScreen,
  '/app/campus/post/:postId': PostDetailScreen,
  '/app/campus/events': EventsScreen,
  '/app/campus/lost-found': LostFoundScreen,
  '/app/campus/confessions': ConfessionsScreen,
  '/app/campus/marketplace': MarketplaceScreen,
  '/app/campus/stories': CampusStoriesScreen,

  '/app/study': NotesVaultScreen,
  '/app/study/notes/:noteId': NoteViewerScreen,
  '/app/study/assignments': AssignmentTrackerScreen,
  '/app/study/exams': ExamCountdownScreen,
  '/app/study/timetable': TimetableScreen,
  '/app/study/pyq': PYQRepositoryScreen,
  '/app/study/buddy': StudyBuddyMatchScreen,
  '/app/study/dsa': DSAGrindRoomScreen,
  '/app/study/whiteboard/:sessionId': WhiteboardScreen,
  '/app/study/voice-room/:roomId': VoiceDoubtRoomScreen,

  '/app/placement': PlacementHubScreen,
  '/app/placement/experiences': InterviewExperiencesScreen,
  '/app/placement/resume': ResumeReviewScreen,
  '/app/placement/referrals': ReferralExchangeScreen,
  '/app/placement/prep/:companyId': CompanyPrepChannelScreen,

  '/app/profile': ProfileScreen,
  '/app/profile/edit': EditProfileScreen,
  '/app/settings': SettingsScreen,
  '/app/mentorship': MentorshipScreen,
  '/app/ask-senior': AskSeniorScreen,
  '/app/notifications': NotificationCenterScreen,
  '/app/search': SearchGlobalScreen,
};
```

---

## 3. Data Models (InsForge PostgreSQL)

### Core Tables

```sql
-- ============================================
-- MODULE 1: USERS & IDENTITY
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_key TEXT,
  branch TEXT,
  semester INTEGER,
  campus_id UUID REFERENCES campuses(id),
  college_email TEXT,
  college_verified BOOLEAN DEFAULT FALSE,
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  placement_status TEXT DEFAULT 'seeking', -- seeking, placed, not_looking
  study_goals TEXT,
  bio TEXT,
  is_senior BOOLEAN DEFAULT FALSE,
  reputation_score INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  anonymous_alias TEXT,
  privacy_level TEXT DEFAULT 'campus', -- public, campus, friends, private
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  university TEXT,
  city TEXT,
  state TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE 2: MESSAGING
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'broadcast', 'subject_channel')),
  name TEXT,
  description TEXT,
  avatar_url TEXT,
  avatar_key TEXT,
  campus_id UUID REFERENCES campuses(id),
  subject TEXT, -- for subject-wise channels
  semester INTEGER,
  created_by UUID REFERENCES profiles(id),
  is_exam_mode BOOLEAN DEFAULT FALSE,
  pinned_message_ids UUID[] DEFAULT '{}',
  max_members INTEGER DEFAULT 256,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN (
    'text', 'image', 'video', 'audio', 'voice_note',
    'document', 'poll', 'link', 'system'
  )),
  reply_to UUID REFERENCES messages(id),
  thread_root UUID REFERENCES messages(id),
  is_doubt BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  media_url TEXT,
  media_key TEXT,
  media_local_id TEXT, -- local IndexedDB reference
  media_size INTEGER,
  media_mime TEXT,
  poll_data JSONB,
  reactions JSONB DEFAULT '{}', -- {"👍": ["user1", "user2"], "❤️": [...]}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- ============================================
-- MODULE 4: NOTES VAULT
-- ============================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id),
  title TEXT NOT NULL,
  content TEXT,
  subject TEXT,
  semester INTEGER,
  tags TEXT[] DEFAULT '{}',
  type TEXT DEFAULT 'note' CHECK (type IN ('note', 'pyq', 'summary', 'recording')),
  file_url TEXT,
  file_key TEXT,
  file_local_id TEXT,
  file_size INTEGER,
  file_mime TEXT,
  ai_summary TEXT,
  ocr_text TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  share_scope TEXT DEFAULT 'private', -- private, group, campus
  folder_path TEXT DEFAULT '/',
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE 5: ASSIGNMENTS & EXAMS
-- ============================================

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id),
  title TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  discussion_id UUID REFERENCES conversations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id),
  title TEXT NOT NULL,
  subject TEXT,
  exam_date TIMESTAMPTZ NOT NULL,
  exam_type TEXT DEFAULT 'internal' CHECK (exam_type IN ('internal', 'external', 'quiz', 'viva')),
  syllabus TEXT,
  marks_total INTEGER,
  marks_obtained INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  subject TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  teacher TEXT,
  type TEXT DEFAULT 'lecture' CHECK (type IN ('lecture', 'lab', 'tutorial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE 6: MENTORSHIP
-- ============================================

CREATE TABLE mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID REFERENCES profiles(id),
  to_user UUID REFERENCES profiles(id),
  question TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'declined')),
  answer TEXT,
  subject_area TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE TABLE senior_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  campus_id UUID REFERENCES campuses(id),
  type TEXT CHECK (type IN ('exam_strategy', 'teacher_insight', 'subject_review', 'fresher_guide')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,
  teacher_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE 7: CAMPUS COMMUNITY
-- ============================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  campus_id UUID REFERENCES campuses(id),
  category TEXT NOT NULL CHECK (category IN (
    'general', 'event', 'hostel', 'lost_found',
    'confession', 'marketplace', 'announcement', 'question'
  )),
  title TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  media_keys TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_reported BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  -- marketplace fields
  price DECIMAL(10,2),
  item_condition TEXT,
  -- lost_found fields
  item_status TEXT, -- lost, found, claimed
  -- event fields
  event_date TIMESTAMPTZ,
  event_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  parent_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  target_type TEXT CHECK (target_type IN ('post', 'comment', 'message', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE 8: STUDY COLLABORATION
-- ============================================

CREATE TABLE study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('study_buddy', 'project_team', 'dsa_grind', 'doubt_room')),
  subject TEXT,
  campus_id UUID REFERENCES campuses(id),
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  is_voice_enabled BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE study_buddy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  subjects TEXT[] DEFAULT '{}',
  study_style TEXT, -- visual, auditory, reading, group
  available_hours TEXT,
  goals TEXT,
  partner_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE 9: STORIES & SHORT CONTENT
-- ============================================

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id),
  media_url TEXT,
  media_key TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'text')),
  caption TEXT,
  category TEXT DEFAULT 'campus' CHECK (category IN ('campus', 'educational', 'trending')),
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE 10: PLACEMENT HUB
-- ============================================

CREATE TABLE interview_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  campus_id UUID REFERENCES campuses(id),
  company TEXT NOT NULL,
  role TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  result TEXT CHECK (result IN ('selected', 'rejected', 'waitlisted', 'pending')),
  rounds JSONB DEFAULT '[]', -- [{name, type, questions, tips}]
  preparation_tips TEXT,
  salary_offered TEXT,
  interview_date DATE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referral_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID REFERENCES profiles(id),
  provider_id UUID REFERENCES profiles(id),
  company TEXT NOT NULL,
  role TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'connected', 'closed')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE 12: NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'message', 'mention', 'assignment', 'exam',
    'mentorship_reply', 'placement_update', 'post_reply',
    'badge_earned', 'study_invite', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  exam_alerts BOOLEAN DEFAULT TRUE,
  assignment_reminders BOOLEAN DEFAULT TRUE,
  mentorship_replies BOOLEAN DEFAULT TRUE,
  placement_updates BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,
  study_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_conv_members_user ON conversation_members(user_id);
CREATE INDEX idx_conv_members_conv ON conversation_members(conversation_id);
CREATE INDEX idx_posts_campus ON posts(campus_id, created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_notes_user ON notes(user_id, semester, subject);
CREATE INDEX idx_assignments_user ON assignments(user_id, status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_profiles_campus ON profiles(campus_id);
CREATE INDEX idx_stories_campus ON stories(campus_id, expires_at);
CREATE INDEX idx_interview_exp_company ON interview_experiences(company);
```

---

## 4. Realtime Messaging Flow

### InsForge Channel Architecture

```sql
-- Realtime channel patterns
INSERT INTO realtime.channels (pattern, description, enabled) VALUES
  ('chat:%', 'Direct & group messaging channels', true),
  ('typing:%', 'Typing indicators per conversation', true),
  ('presence:%', 'User presence per campus', true),
  ('notification:%', 'User notification channels', true),
  ('feed:%', 'Campus feed real-time updates', true),
  ('study_room:%', 'Study room live updates', true),
  ('voice:%', 'Voice room signaling', true);
```

### Message Flow Sequence

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│  Sender  │     │  InsForge    │     │   Recipient(s)   │
│  Client  │     │  Realtime WS │     │   Client(s)      │
└────┬─────┘     └──────┬───────┘     └────────┬─────────┘
     │                  │                      │
     │ 1. Save to       │                      │
     │    IndexedDB     │                      │
     │ (optimistic)     │                      │
     │                  │                      │
     │ 2. INSERT msg ──►│                      │
     │    to DB         │                      │
     │                  │ 3. Trigger fires     │
     │                  │    realtime.publish() │
     │                  │──────────────────────►│
     │                  │  4. new_message event │
     │                  │                      │
     │ 5. Confirm ack ◄─│                      │ 5. Save to
     │    update status │                      │    IndexedDB
     │                  │                      │
```

### Typing Indicator Flow

```typescript
// Sender publishes typing event
insforge.realtime.publish(`typing:${conversationId}`, 'typing', {
  userId: currentUser.id,
  displayName: currentUser.display_name,
  isTyping: true
});

// Recipient listens
insforge.realtime.on('typing', (payload) => {
  if (payload.userId !== currentUser.id) {
    setTypingUsers(prev => payload.isTyping
      ? [...prev, payload]
      : prev.filter(u => u.userId !== payload.userId)
    );
  }
});
```

### Presence System

```typescript
// On app open
insforge.realtime.subscribe(`presence:${campusId}`);
insforge.realtime.publish(`presence:${campusId}`, 'user_online', {
  userId: currentUser.id,
  status: 'online',
  timestamp: Date.now()
});

// On app close / visibility hidden
insforge.realtime.publish(`presence:${campusId}`, 'user_offline', {
  userId: currentUser.id,
  status: 'offline',
  lastSeen: Date.now()
});
```

---

## 5. P2P File Transfer Design

### Architecture

```
┌──────────┐                          ┌──────────┐
│  Device  │  WebRTC DataChannel      │  Device  │
│    A     │◄────────────────────────►│    B     │
│          │  (files, chunks, acks)   │          │
└────┬─────┘                          └────┬─────┘
     │                                     │
     │  Signaling via                      │
     │  InsForge Realtime                  │
     │                                     │
     └──────────────────┬──────────────────┘
                        │
                ┌───────┴───────┐
                │  InsForge WS  │
                │  (signaling   │
                │   only)       │
                └───────────────┘
```

### Transfer Protocol

```typescript
// P2P Transfer Manager
interface P2PTransfer {
  id: string;
  senderId: string;
  receiverId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize: number; // 64KB default
  totalChunks: number;
  transferredChunks: number;
  status: 'pairing' | 'connecting' | 'transferring' | 'completed' | 'failed';
}

// QR Pairing Flow
// 1. Device A generates pairing code + QR
// 2. Device B scans QR → gets pairing channel ID
// 3. Both subscribe to `p2p:{pairingId}`
// 4. WebRTC offer/answer exchanged via realtime publish
// 5. DataChannel established → chunked file transfer
// 6. Each chunk ACK'd → progress updates

// Chunk Transfer
const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const sendFile = async (file: File, dataChannel: RTCDataChannel) => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const chunk = file.slice(start, start + CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();
    dataChannel.send(buffer);
    // Wait for ACK before next chunk (flow control)
  }
};
```

### Fallback Strategy

```
1. WebRTC DataChannel (ideal: same network or TURN)
2. WiFi Direct / Hotspot (Android native)
3. LAN HTTP server (fallback for desktop)
4. Cloud relay via InsForge Storage (last resort, user consent required)
```

---

## 6. Offline Sync Logic

### Local-First Architecture

```
┌─────────────────────────────────────────┐
│              CLIENT DEVICE              │
│                                         │
│  ┌──────────┐    ┌──────────────────┐  │
│  │ React UI │◄──►│  Zustand Store   │  │
│  └──────────┘    └────────┬─────────┘  │
│                           │             │
│                  ┌────────▼─────────┐  │
│                  │  IndexedDB       │  │
│                  │  (Dexie.js)      │  │
│                  │  ─────────       │  │
│                  │  messages        │  │
│                  │  conversations   │  │
│                  │  notes           │  │
│                  │  media_cache     │  │
│                  │  sync_queue      │  │
│                  └────────┬─────────┘  │
│                           │             │
│                  ┌────────▼─────────┐  │
│                  │  Sync Engine     │  │
│                  │  (Background)    │  │
│                  └────────┬─────────┘  │
│                           │             │
└───────────────────────────┼─────────────┘
                            │ Only metadata
                   ┌────────▼─────────┐
                   │  InsForge Cloud  │
                   │  (metadata only) │
                   └──────────────────┘
```

### Sync Strategy

```typescript
interface SyncQueue {
  id: string;
  operation: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  createdAt: number;
}

// Sync Engine
class SyncEngine {
  // 1. On user action → write to IndexedDB immediately (optimistic)
  // 2. Add to sync_queue
  // 3. On network available → process queue FIFO
  // 4. On conflict → last-write-wins with user prompt for critical data
  // 5. Background sync via Service Worker
  // 6. Exponential backoff on failure

  async processQueue() {
    const pending = await db.syncQueue
      .where('status').equals('pending')
      .sortBy('createdAt');

    for (const item of pending) {
      try {
        await this.syncToCloud(item);
        await db.syncQueue.update(item.id, { status: 'synced' });
      } catch (err) {
        await db.syncQueue.update(item.id, {
          status: 'failed',
          retryCount: item.retryCount + 1
        });
      }
    }
  }
}
```

### IndexedDB Schema (Dexie.js)

```typescript
const db = new Dexie('CampuslyDB');
db.version(1).stores({
  messages: 'id, conversationId, senderId, createdAt, [conversationId+createdAt]',
  conversations: 'id, type, updatedAt',
  conversationMembers: 'id, conversationId, userId, [conversationId+userId]',
  notes: 'id, userId, subject, semester, folderPath',
  mediaCache: 'id, messageId, localPath, mimeType, size, cachedAt',
  syncQueue: 'id, status, table, createdAt',
  profiles: 'id, campusId',
  assignments: 'id, userId, status, dueDate',
  exams: 'id, userId, examDate',
  notifications: 'id, userId, isRead, createdAt',
  bookmarks: 'id, userId, messageId',
  settings: 'key'
});
```

---

## 7. UI Component List

### Foundation Components
| Component | Description |
|-----------|-------------|
| `Avatar` | User avatar with online indicator |
| `Badge` | Notification badge, reputation badge |
| `Button` | Primary, secondary, ghost, danger variants |
| `Card` | Container with shadow and border |
| `Chip` | Tags, filters, skills display |
| `Divider` | Section separator |
| `Icon` | Lucide icons wrapper |
| `Input` | Text, email, password, search |
| `Modal` | Overlay dialog |
| `Select` | Dropdown selector |
| `Skeleton` | Loading placeholder |
| `Switch` | Toggle switch |
| `Tabs` | Tab navigation |
| `Toast` | Notification toasts |
| `Tooltip` | Hover tooltips |

### Chat Components
| Component | Description |
|-----------|-------------|
| `ChatBubble` | Message bubble (sent/received) |
| `ChatInput` | Message composer with attachments |
| `ChatListItem` | Conversation preview row |
| `MediaMessage` | Image/video/doc in chat |
| `PollMessage` | Interactive poll in chat |
| `VoiceNotePlayer` | Audio waveform player |
| `ReactionPicker` | Emoji reaction selector |
| `TypingIndicator` | Animated dots |
| `ThreadView` | Threaded replies panel |
| `MessageSearch` | Search within chat |
| `DateSeparator` | Date divider in chat |
| `SystemMessage` | System event display |

### Feed Components
| Component | Description |
|-----------|-------------|
| `PostCard` | Feed post with vote/comment |
| `PostComposer` | Create new post |
| `CommentThread` | Nested comments |
| `EventCard` | Event with date/location |
| `MarketplaceItem` | Buy/sell listing |
| `ConfessionCard` | Anonymous confession post |
| `StoryRing` | Story avatar ring |
| `StoryViewer` | Full-screen story view |

### Study Components
| Component | Description |
|-----------|-------------|
| `FolderTree` | Semester/subject navigation |
| `NoteCard` | Note preview card |
| `AssignmentRow` | Assignment with status/due date |
| `ExamCountdown` | Countdown timer card |
| `TimetableGrid` | Weekly schedule grid |
| `StudyBuddyCard` | Match profile card |
| `WhiteboardCanvas` | Collaborative drawing |
| `VoiceRoomControls` | Mute/unmute/leave |

### Placement Components
| Component | Description |
|-----------|-------------|
| `ExperienceCard` | Interview experience |
| `CompanyTag` | Company name with logo |
| `ReferralCard` | Referral request/offer |
| `DifficultyBadge` | Easy/medium/hard indicator |

### Layout Components
| Component | Description |
|-----------|-------------|
| `BottomTabBar` | Main navigation tabs |
| `TopBar` | Screen header with actions |
| `FloatingActionButton` | Primary action button |
| `PullToRefresh` | Pull-to-refresh wrapper |
| `InfiniteScroll` | Virtualized list |
| `EmptyState` | No-data placeholder |
| `ErrorState` | Error with retry |
| `OfflineBanner` | Network status indicator |

---

## 8. Scalable Module Structure

```
src/
├── main.tsx                    # App entry
├── App.tsx                     # Root component + router
├── vite-env.d.ts
│
├── lib/
│   ├── insforge.ts             # InsForge client singleton
│   ├── db.ts                   # Dexie.js local database
│   ├── sync.ts                 # Sync engine
│   ├── crypto.ts               # E2E encryption utilities
│   ├── p2p.ts                  # WebRTC P2P manager
│   ├── webrtc.ts               # Voice/video room manager
│   └── utils.ts                # Shared utilities
│
├── hooks/
│   ├── useAuth.ts              # Auth state hook
│   ├── useChat.ts              # Chat operations hook
│   ├── useRealtime.ts          # Realtime subscription hook
│   ├── useOffline.ts           # Offline detection hook
│   ├── useLocalDB.ts           # IndexedDB operations hook
│   ├── useP2P.ts               # P2P transfer hook
│   ├── useVoiceRoom.ts         # Voice room hook
│   ├── useNotifications.ts     # Notifications hook
│   └── useInfiniteScroll.ts    # Pagination hook
│
├── stores/
│   ├── authStore.ts            # User authentication state
│   ├── chatStore.ts            # Active chat state
│   ├── feedStore.ts            # Campus feed state
│   ├── studyStore.ts           # Notes, assignments, exams
│   ├── notificationStore.ts    # Notifications state
│   ├── presenceStore.ts        # Online users state
│   └── settingsStore.ts       # App preferences
│
├── components/
│   ├── ui/                     # Foundation components
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   └── ...
│   │
│   ├── chat/                   # Chat components
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatListItem.tsx
│   │   ├── MediaMessage.tsx
│   │   ├── PollMessage.tsx
│   │   ├── VoiceNotePlayer.tsx
│   │   ├── ReactionPicker.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── ...
│   │
│   ├── feed/                   # Campus feed components
│   │   ├── PostCard.tsx
│   │   ├── PostComposer.tsx
│   │   ├── CommentThread.tsx
│   │   ├── EventCard.tsx
│   │   ├── StoryRing.tsx
│   │   └── ...
│   │
│   ├── study/                  # Study components
│   │   ├── FolderTree.tsx
│   │   ├── NoteCard.tsx
│   │   ├── AssignmentRow.tsx
│   │   ├── ExamCountdown.tsx
│   │   ├── TimetableGrid.tsx
│   │   └── ...
│   │
│   ├── placement/              # Placement components
│   │   ├── ExperienceCard.tsx
│   │   ├── ReferralCard.tsx
│   │   └── ...
│   │
│   └── layout/                 # Layout components
│       ├── BottomTabBar.tsx
│       ├── TopBar.tsx
│       ├── MainLayout.tsx
│       ├── OfflineBanner.tsx
│       └── ...
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── CampusSelectPage.tsx
│   │   └── ProfileSetupPage.tsx
│   │
│   ├── chat/
│   │   ├── ChatListPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── GroupInfoPage.tsx
│   │   └── NewChatPage.tsx
│   │
│   ├── campus/
│   │   ├── FeedPage.tsx
│   │   ├── PostDetailPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── StoriesPage.tsx
│   │   └── ...
│   │
│   ├── study/
│   │   ├── NotesVaultPage.tsx
│   │   ├── AssignmentsPage.tsx
│   │   ├── ExamsPage.tsx
│   │   ├── StudyBuddyPage.tsx
│   │   └── ...
│   │
│   ├── placement/
│   │   ├── PlacementHubPage.tsx
│   │   ├── ExperiencesPage.tsx
│   │   └── ...
│   │
│   └── profile/
│       ├── ProfilePage.tsx
│       ├── SettingsPage.tsx
│       └── ...
│
├── services/
│   ├── authService.ts          # Auth API calls
│   ├── chatService.ts          # Chat API calls
│   ├── feedService.ts          # Feed API calls
│   ├── studyService.ts         # Study API calls
│   ├── placementService.ts     # Placement API calls
│   ├── notificationService.ts  # Notification API calls
│   └── aiService.ts            # AI operations
│
├── types/
│   ├── auth.types.ts
│   ├── chat.types.ts
│   ├── feed.types.ts
│   ├── study.types.ts
│   ├── placement.types.ts
│   └── common.types.ts
│
└── workers/
    ├── sw.ts                   # Service Worker (PWA)
    ├── syncWorker.ts           # Background sync worker
    └── encryptionWorker.ts     # E2E encryption worker
```

---

## 9. Performance Optimization Plan

### Bundle Optimization
| Strategy | Implementation |
|----------|---------------|
| **Code Splitting** | Route-based lazy loading with `React.lazy()` |
| **Tree Shaking** | Vite built-in, minimal imports |
| **Chunk Optimization** | Manual chunk splitting for vendor libs |
| **Compression** | Brotli/Gzip static assets |
| **Target Size** | Initial bundle < 150KB gzipped |

### Runtime Performance
| Strategy | Implementation |
|----------|---------------|
| **Virtual Lists** | `@tanstack/react-virtual` for chat messages, feeds |
| **Image Optimization** | Lazy loading, progressive JPEG, WebP conversion |
| **Memoization** | `React.memo`, `useMemo`, `useCallback` aggressively |
| **Debouncing** | Search inputs, typing indicators (300ms) |
| **Throttling** | Scroll handlers, resize events (16ms) |
| **Web Workers** | Encryption, heavy computations off main thread |

### Network Optimization
| Strategy | Implementation |
|----------|---------------|
| **Request Batching** | Batch multiple API calls |
| **Stale-While-Revalidate** | React Query cache policies |
| **Pagination** | Cursor-based for messages, offset for feeds |
| **Compression** | Request/response body compression |
| **Delta Sync** | Only sync changed records since lastSync |
| **Prefetching** | Preload adjacent chat conversations |

### Storage Optimization
| Strategy | Implementation |
|----------|---------------|
| **IndexedDB LRU** | Auto-evict old media cache (configurable limit) |
| **Deduplication** | Content-hash based media dedup |
| **Compression** | Compress text content in IndexedDB |
| **Lazy Cleanup** | Background cleanup on idle |

### PWA Optimization
| Strategy | Implementation |
|----------|---------------|
| **Cache-First** | Static assets served from service worker cache |
| **Network-First** | API calls with cache fallback |
| **Background Sync** | Queue failed API calls for retry |
| **Push Notifications** | Web Push API for engagement |
| **App Shell** | Cached app shell for instant load |

---

## 10. Deployment Strategy for MVP

### Phase 1: MVP Core (Week 1-2)
- [ ] Project scaffolding with Vite + React + TypeScript
- [ ] InsForge client setup with anon key
- [ ] Database schema creation (all tables)
- [ ] Auth flow (signup, login, Google OAuth)
- [ ] Profile setup (campus, branch, semester)
- [ ] Basic 1-to-1 messaging with realtime
- [ ] Group chat creation
- [ ] Message types: text, image, voice note
- [ ] IndexedDB local storage
- [ ] Basic offline support

### Phase 2: Campus Experience (Week 3-4)
- [ ] Campus community feed
- [ ] Post creation with categories
- [ ] Comments and voting
- [ ] Notes vault with folder structure
- [ ] Assignment tracker
- [ ] Exam countdown
- [ ] Push notifications

### Phase 3: Collaboration (Week 5-6)
- [ ] Study buddy matching
- [ ] Voice doubt rooms (WebRTC)
- [ ] P2P file sharing
- [ ] Mentorship system
- [ ] Ask senior flow
- [ ] AI note summarization

### Phase 4: Placement & Polish (Week 7-8)
- [ ] Placement hub
- [ ] Interview experiences
- [ ] Campus stories
- [ ] Performance optimization
- [ ] PWA manifest + service worker
- [ ] InsForge deployment
- [ ] Beta testing

### Deployment Pipeline

```
Development → InsForge Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Local dev: npm run dev
2. Build: npm run build
3. Deploy: InsForge create-deployment MCP tool
   - Source: ./
   - Build cmd: npm run build
   - Output: dist/
   - Env vars: VITE_INSFORGE_BASE_URL, VITE_INSFORGE_ANON_KEY

Production URL: Provided by InsForge after deployment
```

### Storage Buckets Needed
| Bucket | Purpose | Public |
|--------|---------|--------|
| `avatars` | User profile pictures | Yes |
| `chat-media` | Chat images/videos/docs | Yes |
| `notes` | Shared study notes | Yes |
| `campus-media` | Feed post media | Yes |
| `stories` | Story images/short videos | Yes |
| `resumes` | Resume uploads | No |

---

## Key Architecture Decisions

1. **React + Vite over Next.js**: SPA is better for messaging apps — no SSR needed, faster client-side navigation, simpler PWA support
2. **Tailwind CSS 3.4**: Per InsForge requirement, locked version
3. **Zustand over Redux**: Simpler, less boilerplate, better for real-time state
4. **Dexie.js over raw IndexedDB**: Type-safe, reactive queries, simpler API
5. **InsForge Realtime over custom WS**: Built-in channel auth, triggers, scalability
6. **WebRTC for P2P**: Browser-native, no extra infrastructure for file sharing
7. **Service Workers for PWA**: Offline support, push notifications, background sync
