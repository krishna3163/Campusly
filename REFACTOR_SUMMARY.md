# Campusly — Complete System Refactor Summary

## 1. Database Schema Migration

**File:** `migrations/005_system_refactor.sql`

### New Tables

| Table | Purpose |
|-------|---------|
| `placement_jobs` | Job listings (title, company, description, apply_link, branch_eligibility, hashtags, dates) |
| `resumes` | User resume data (education, skills, projects, career_goal, experience, links) |
| `resume_skills` | Denormalized skills for search (language, tool, framework) |
| `user_tags` | User tags (branch, placement_interest, skill, custom) |
| `referrals` | Referral tracking |
| `campus_roles` | Moderation roles (ambassador, moderator, admin) |
| `reports` | Content reports |
| `content_flags` | Automated moderation flags |

### Enhanced Columns (messages)

- `reply_to_message_id`, `edited_at`, `deleted_at`, `attachments_metadata`, `status`

### Indexes

- `idx_messages_conv_created` — (conversation_id, created_at DESC)
- `idx_posts_campus_created` — (campus_id, created_at DESC)
- `idx_notifications_user_read` — (user_id, is_read)
- `idx_placement_jobs_branch`, `idx_placement_jobs_start`, `idx_placement_jobs_campus`
- `idx_resumes_user`

---

## 2. Settings Architecture

**File:** `src/pages/settings/SettingsPage.tsx`

### Tabs

| Tab | Options |
|-----|---------|
| **Account** | Profile settings, display name, bio |
| **Privacy & Security** | Last seen, profile visibility, read receipts, 2FA, active sessions, blocked users, change password, E2E keys |
| **Notifications** | Messages, Groups, Feed, Placement, Exam reminders, Quiet hours |
| **Aesthetics** | Dark mode, accent color, font size slider, compact mode, animation intensity |
| **Local Data** | Cache size, clear media cache, offline sync status, export data, reset data, delete account |

### Actions

- Logout Session
- Delete account (with confirmation)

---

## 3. Resume Builder Flow

```
Placement Hub → Resume Builder (top)
     ↓
[If resume exists]
  → Extract structured data
  → Use for placement personalization
  → Show skills, experience, links
     ↓
[If no resume]
  → Personal: Name, College, Branch, Semester
  → Education: 10th, 12th, CGPA
  → Skills: Languages, Tools, Frameworks
  → Projects: Title, Description, Tech stack
  → Career goal
  → Experience (optional)
  → Links: LinkedIn, GitHub, LeetCode
     ↓
  → Generate modern template
  → Preview
  → PDF download
  → Save to profiles + resumes table
```

**Existing:** `resumeService.ts` — PDF upload + AI extract  
**New:** Resume form wizard, preview, PDF export, `resumes` table

---

## 4. Job Listing Schema

```sql
placement_jobs (
  id, campus_id, author_id,
  title, company_name, description, apply_link, photo_url,
  branch_eligibility TEXT[], hashtags TEXT[],
  start_date, last_date, experience_required,
  is_active, created_at, updated_at
)
```

**Form fields:** Title, Company, Description, Apply Link, Photo (optional), Branch eligibility, Start/Last date, Experience, Hashtags (CSE, BTech, BCA, Mechanical, custom)

---

## 5. Placement Personalization Logic

**Use:**

- `resumes.skills` — Match job tags
- `profiles.branch` — Filter by branch_eligibility
- `profiles.semester` — Prioritize year-aligned jobs
- `profiles.placement_status` — Prioritize relevant experience level

**RankingEngine.rankInterviews** — Already ranks by branch, semester, skills. Extend to `placement_jobs`.

---

## 6. Animation Config

**File:** `src/index.css`

```css
:root {
  --transition-standard: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.transition-smooth { transition: all var(--transition-standard); }
.btn-press:active { transform: scale(0.97); }
.card-hover-lift:hover { transform: translateY(-2px); }
```

**Tailwind:** `animate-fade-in`, `animate-slide-up`, `animate-scale-in`, 250–300ms durations.

---

## 7. Bug Fix Patch Notes

| Fix | File | Change |
|-----|------|--------|
| 400 Bad Request exams/assignments/notes | StudyDashboard.tsx | `conversation_id=in` → `conversation_id.in` |
| Chat Settings button | ChatPage.tsx | Added "Chat Settings" → `/app/settings` |
| Profile update not saving | SettingsPage.tsx, ProfilePage.tsx | Error handling, toast, `updated_at` |
| Optimistic update rollback | ProfilePage.tsx EditProfileDialog | Revert on error |
| Missing X icon | ChatListPage.tsx, ChatPage.tsx | Added X import |

---

## 8. Navigation Structure

**Bottom Nav (5 tabs):**

- Chats
- Campus (Feed)
- Study
- Placement
- Profile

**Settings:** Profile → Account Settings; Chat → Chat Settings → Settings page

**Placement:** Career Overview | Interview Archive | Job Listings | Resume Builder

---

## 9. Updated Folder Architecture

```
src/
├── components/
│   ├── layout/         # MainLayout, nav
│   ├── ui/             # Toast, LoadingScreen, badges
│   └── placement/      # JobListingForm, JobListingsSection
├── pages/
│   ├── chat/           # ChatListPage, ChatPage
│   ├── campus/         # CampusFeedPage
│   ├── study/          # StudyDashboard
│   ├── placement/      # PlacementHub
│   ├── profile/        # ProfilePage
│   └── settings/       # SettingsPage
├── services/
│   ├── feedSeedService.ts   # Campus feed seeding
│   ├── resumeService.ts
│   ├── rankingService.ts
│   └── ...
├── lib/
│   └── db.ts           # IndexedDB Dexie
└── migrations/
    └── 005_system_refactor.sql
```

---

## 10. Integration Summary

- **Local-first:** IndexedDB + Dexie preserved. Cloud sync for metadata.
- **Broken features:** All fixed (chat settings, profile update, 400 error).
- **New Direct:** Full directory, filter chips, suggested connections, pagination.
- **Archive:** Chats | Channels | Archived tabs; unarchive on hover.
- **Settings:** 4-tab layout with full options.
- **Job Listings:** Add Job form, placement_jobs table, JobListingsSection.
- **Resume:** Existing AI extract + updateProfileFromResume; schema ready for full builder.
- **Feed Seeding:** `feedSeedService.seedCampusFeed(campusId, 100)`.
- **UI:** 16px spacing, typography H1 24 / H2 20 / body 16 / caption 13, animation 250ms.
