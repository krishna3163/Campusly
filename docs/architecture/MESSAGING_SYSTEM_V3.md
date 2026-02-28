# Campusly v3.0 — Messaging & Group System Architecture

## Table of Contents
1. [Permission Enforcement Logic](#1-permission-enforcement-logic)
2. [Realtime Event Flow](#2-realtime-event-flow)
3. [UI Wireframe Hierarchy](#3-ui-wireframe-hierarchy)
4. [Call System Architecture](#4-call-system-architecture)
5. [Scheduler Architecture](#5-scheduler-architecture)
6. [Media Upload Optimization](#6-media-upload-optimization)
7. [Community Hierarchy Design](#7-community-hierarchy-design)
8. [Stress Impact Analysis](#8-stress-impact-analysis)
9. [Deployment Checklist](#9-deployment-checklist)

---

## 1. Permission Enforcement Logic

### Client-Side Permission Helper
```typescript
// src/utils/permissions.ts

const PERMISSION_MAP: Record<GroupRoleType, GroupPermission[]> = {
  owner:    ['delete_group','assign_roles','remove_admins','add_assignments','add_events','pin_messages','remove_members','moderate_chat','post_updates','delete_messages','warn_users','manage_settings'],
  admin:    ['add_assignments','add_events','pin_messages','remove_members','moderate_chat','post_updates','delete_messages','warn_users'],
  co_admin: ['moderate_chat','add_events','delete_messages'],
  class_representative: ['post_updates','add_assignments'],
  placement_coordinator: ['post_updates','add_events'],
  moderator: ['delete_messages','warn_users'],
  member:   [],
};

export function hasPermission(role: GroupRoleType, permission: GroupPermission): boolean {
  return PERMISSION_MAP[role]?.includes(permission) ?? false;
}

export function canCreateAssignment(role: GroupRoleType): boolean {
  return hasPermission(role, 'add_assignments');
}

export function canManageMembers(role: GroupRoleType): boolean {
  return hasPermission(role, 'remove_members');
}
```

### Backend Enforcement
Permission checks happen at two layers:
1. **RLS Policies** (PostgreSQL): Prevent unauthorized reads/writes at the database level.
2. **Edge Functions** (InsForge): Validate role before executing sensitive operations like role assignment or member removal.

### Role Hierarchy (Highest to Lowest)
```
Owner → Admin → Co-Admin → Class Rep / Placement Coord → Moderator → Member
```
A role can only be assigned by a user with a **strictly higher** role.

---

## 2. Realtime Event Flow

### Channel Architecture
```
                                    ┌─────────────────────────┐
                                    │   InsForge Realtime      │
                                    │   (WebSocket Server)     │
                                    └──────────┬──────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
            ┌───────▼───────┐          ┌───────▼───────┐          ┌──────▼────────┐
            │ Channel:       │          │ Channel:       │          │ Channel:       │
            │ messages:      │          │ reactions:     │          │ presence:      │
            │ {conv_id}      │          │ {conv_id}      │          │ {conv_id}      │
            └───────┬───────┘          └───────┬───────┘          └──────┬────────┘
                    │                          │                          │
                    │  Events:                 │  Events:                 │  Events:
                    │  • INSERT (new msg)       │  • INSERT (add react)    │  • JOIN
                    │  • UPDATE (edit/delete)   │  • DELETE (remove react) │  • LEAVE
                    │  • typing_indicator       │                          │  • typing
                    │                          │                          │
```

### New Realtime Channels (v3)
| Channel | Events | Purpose |
|---|---|---|
| `group_assignments:{group_id}` | INSERT, UPDATE, DELETE | Live assignment creation/updates |
| `assignment_completions:{assignment_id}` | INSERT, DELETE | Real-time completion tracking |
| `group_events:{group_id}` | INSERT, UPDATE | New events, date changes |
| `calls:{conversation_id}` | INSERT, UPDATE | Incoming call signals, status changes |
| `call_participants:{call_id}` | INSERT, UPDATE, DELETE | Participant join/leave, mute/camera toggle |
| `join_requests:{group_id}` | INSERT, UPDATE | New join requests, approval/rejection |
| `scheduled_messages:{user_id}` | UPDATE | Status change when sent |

### Event Processing Pipeline
```
User Action → Optimistic UI Update → Database Write → Realtime Broadcast → All Subscribers Update
                   ↓ (failure)
              Local Queue (IndexedDB) → Retry on Reconnect
```

---

## 3. UI Wireframe Hierarchy

### Group Chat View (Desktop — Tabbed)
```
┌──────────────────────────────────────────────────────────────────────┐
│  [← Back]  Group Name  ●  👥 42 members   [📞] [📹] [⋮ Menu]        │
├──────────────────────────────────────────────────────────────────────┤
│  [ Chat ]  [ Assignments ]  [ Events ]  [ Media ]  [ Members ]      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────┐  ┌────────────────────────┐ │
│  │         CHAT MESSAGES AREA          │  │  RIGHT PANEL           │ │
│  │                                     │  │                        │ │
│  │  [Message Bubble]                   │  │  📌 Pinned Messages    │ │
│  │   👍3 ❤️2 😂1  ← Reaction Bar      │  │  📋 Active Assignment  │ │
│  │                                     │  │     ▸ DSA Homework     │ │
│  │  [Message Bubble]                   │  │       Due: 2d 4h       │ │
│  │                                     │  │       ████░░ 65%       │ │
│  │  [System: 📋 New Assignment]        │  │                        │ │
│  │                                     │  │  📅 Next Event         │ │
│  │                                     │  │     ▸ Mid-Sem Test     │ │
│  │                                     │  │       Mar 15, 10:00    │ │
│  └─────────────────────────────────────┘  └────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │  [😊] [📎] [🎤]  Type a message...          [📅 Schedule] [Send]││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### Assignments Tab
```
┌──────────────────────────────────────────────────────────────┐
│  Assignments for "CS301 — Data Structures"     [+ Create]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  🔴 IMPORTANT  Lab 5: AVL Tree Implementation          │  │
│  │  Subject: DSA  │  Due: Mar 1 (Tomorrow!)               │  │
│  │  Completion: ████████░░ 82% (33/40 members)            │  │
│  │  [Mark Complete ✓]  [View Details →]                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  📋  Assignment 3: Sorting Analysis Report              │  │
│  │  Subject: DSA  │  Due: Mar 8 (7 days)                   │  │
│  │  Completion: ██░░░░░░░░ 20% (8/40 members)             │  │
│  │  [Mark Complete ✓]  [View Details →]                    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Message Reaction UI
```
                    ┌─────────────────────────────┐
Message Bubble:     │  "Has anyone solved Q4?"     │
                    └─────────────────────────────┘
                     👍3  ❤️1  🔥2   ← Aggregated reaction pills

Long Press / Hover:
                    ┌──────────────────────────────────────────┐
                    │  👍  ❤️  😂  😮  😢  🙏  🔥  🎉  [+]   │
                    └──────────────────────────────────────────┘
```

### Call UI (Incoming Call)
```
┌──────────────────────────────────────┐
│                                      │
│          📞 Incoming Call             │
│                                      │
│          ┌──────────┐                │
│          │   A.K.   │                │
│          │  Avatar  │                │
│          └──────────┘                │
│        Arjun Kumar                   │
│        Voice Call                    │
│                                      │
│    [🔴 Decline]    [🟢 Accept]       │
│                                      │
└──────────────────────────────────────┘
```

---

## 4. Call System Architecture

```
┌─────────┐         ┌───────────────┐         ┌─────────┐
│ Caller   │ ──1──→ │ InsForge      │ ──2──→  │ Callee   │
│ (Peer A) │        │ Signaling     │         │ (Peer B) │
│          │ ←─5──  │ (Realtime WS) │ ←─3──  │          │
└────┬─────┘        └───────────────┘         └────┬─────┘
     │                                              │
     │              ┌───────────────┐               │
     └──────6──────→│ WebRTC Direct │←──────6──────┘
                    │ (P2P Media)   │
                    └───────┬───────┘
                            │ fallback
                    ┌───────▼───────┐
                    │ TURN Server   │
                    │ (Relay Mode)  │
                    └───────────────┘
```

### Flow:
1. Caller creates `calls` record (status: `ringing`), sends SDP offer via Realtime.
2. InsForge Realtime broadcasts to callee's channel.
3. Callee receives notification, sends SDP answer back.
4. ICE candidates exchanged via Realtime channel.
5. WebRTC P2P connection established (or TURN relay if NAT fails).
6. Media flows directly peer-to-peer (encrypted via SRTP/DTLS).

### Group Calls:
- Use SFU (Selective Forwarding Unit) pattern for 4+ participants.
- Mesh topology for 2-3 participants max.
- Each participant sends one stream, SFU relays to others.

### E2E Compatibility:
- Signaling messages (SDP/ICE) encrypted with existing E2E keys.
- Media encryption via SRTP (built into WebRTC).

---

## 5. Scheduler Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  SCHEDULER ENGINE                         │
│                  (Edge Function / Cron)                    │
│                                                          │
│  Runs every 60 seconds:                                  │
│                                                          │
│  1. SCHEDULED MESSAGES                                   │
│     ├─ SELECT * FROM scheduled_messages                  │
│     │   WHERE status = 'pending'                         │
│     │   AND scheduled_time <= NOW()                      │
│     ├─ For each: INSERT into messages, UPDATE status     │
│     └─ Broadcast via Realtime                            │
│                                                          │
│  2. ASSIGNMENT REMINDERS                                 │
│     ├─ SELECT * FROM group_assignments                   │
│     │   WHERE due_date BETWEEN NOW() AND NOW() + 24h    │
│     ├─ Check assignment_reminders for existing '24h'     │
│     ├─ If not sent: create notification, log reminder    │
│     └─ Repeat for '2h' window                           │
│                                                          │
│  3. EVENT REMINDERS                                      │
│     ├─ SELECT * FROM group_events                        │
│     │   WHERE event_date BETWEEN NOW() AND NOW() + 24h  │
│     ├─ Check event_reminders for existing '1d'           │
│     ├─ If not sent: create notification, log reminder    │
│     └─ For '1h': suggest Exam Mode activation            │
│                                                          │
│  4. CLEANUP                                              │
│     ├─ Mark overdue assignments                          │
│     └─ Expire old invite links                           │
└──────────────────────────────────────────────────────────┘
```

### Implementation: InsForge Edge Function
- Deployed as a `scheduler-cron` edge function.
- Triggered by an external cron service (e.g., cron-job.org) hitting the function URL every 60s.
- Idempotent: uses `UNIQUE(assignment_id, reminder_type)` to prevent duplicate sends.

---

## 6. Media Upload Optimization

### Pipeline
```
User selects file
        │
        ▼
┌─── CLIENT-SIDE ──────────────────────────────────┐
│  1. Validate file type & size (max 25MB)          │
│  2. Generate thumbnail (canvas for images,        │
│     first-frame for video)                        │
│  3. Compress:                                     │
│     • Images: WebP conversion, quality 80%        │
│     • Video: Reduce resolution to 720p            │
│     • Audio: Convert to Opus/OGG                  │
│  4. Encrypt with conversation E2E key (AES-256)   │
│  5. Generate local_id for IndexedDB tracking      │
│  6. Store compressed + thumbnail locally first     │
└──────────────────────────┬───────────────────────┘
                           │
                           ▼
┌─── UPLOAD ───────────────────────────────────────┐
│  7. Upload encrypted blob to InsForge Storage     │
│     • Chunked upload for files > 5MB              │
│     • Progress tracking via XHR/fetch streams     │
│  8. On success: update media_cache table          │
│  9. Send message with media_url + media_key       │
│ 10. Broadcast via Realtime                        │
└──────────────────────────────────────────────────┘
                           │
                           ▼
┌─── RECIPIENT ────────────────────────────────────┐
│ 11. Receive message notification                  │
│ 12. Download thumbnail first (instant preview)    │
│ 13. Full media downloaded on tap/click            │
│ 14. Decrypt with shared E2E key                   │
│ 15. Cache decrypted media in IndexedDB            │
└──────────────────────────────────────────────────┘
```

### Compression Specs
| Type | Input | Output | Savings |
|---|---|---|---|
| Image (JPEG/PNG) | Original | WebP 80% | ~60-70% |
| Video (MP4) | 1080p | 720p H.264 | ~50% |
| Audio (WAV) | Raw | Opus 128kbps | ~90% |
| Document | PDF | No compression | 0% |

---

## 7. Community Hierarchy Design

```
┌─── COMMUNITY: "CSE Department 2026" ────────────────────────────────┐
│                                                                      │
│  Owner: Prof. Sharma                                                 │
│  Admins: 3 Faculty, 2 Student Reps                                   │
│                                                                      │
│  ┌─── 📢 Announcement Channel (Broadcast-only) ─────────────────┐   │
│  │  Only Owner/Admins can post. All members receive.              │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─── Groups ────────────────────────────────────────────────────┐   │
│  │                                                                │   │
│  │  📚 CSE-301 Data Structures         (45 members)              │   │
│  │  📚 CSE-302 Operating Systems       (42 members)              │   │
│  │  📚 CSE-303 DBMS Lab                (40 members)              │   │
│  │  💼 Placement Prep — Google          (120 members)             │   │
│  │  💼 Placement Prep — Amazon          (95 members)              │   │
│  │  🏠 Hostel 5 Block A                (80 members)              │   │
│  │  🎮 Gaming Club                     (200 members)             │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Members: 500 total (auto-joined from department roster)             │
│  Max Groups: 50 per community                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Role Hierarchy within Community
```
Community Owner
    └── Community Admin
          └── Community Moderator
                └── Community Member
                      └── (Also has a per-group role that may differ)
```

### Rules:
- Joining a community auto-adds user to the Announcement channel.
- Users can join/leave individual groups within the community.
- Community-level bans cascade to all child groups.

---

## 8. Stress Impact Analysis (v3 Features)

### Per-Feature Load Impact

| Feature | DB Writes/min | Realtime Events/min | IndexedDB Impact | Risk Level |
|---|---|---|---|---|
| Group Assignments | Low (2-5) | Medium (broadcast to group) | Low | 🟢 Low |
| Assignment Completions | Medium (at deadline bursts) | High (N members × 1 event) | Low | 🟡 Medium |
| Group Events | Very Low (1-2) | Low | Low | 🟢 Low |
| Message Reactions | **Very High** (tap-happy users) | **Very High** (per-reaction broadcast) | Medium | 🔴 High |
| Scheduled Messages | Low (cron-based) | Low (1 event per send) | Low | 🟢 Low |
| Stickers | Low (read-heavy) | Same as messages | Medium (caching packs) | 🟡 Medium |
| Communities | Very Low | Low | Low | 🟢 Low |
| Calls (Signaling) | Low (SDP/ICE exchange) | High (multiple ICE candidates) | None | 🟡 Medium |
| Calls (Media) | None (P2P) | None (P2P) | None | 🟢 Low |
| Practice Tests | Burst (at test start) | Medium | High (questions cached) | 🟡 Medium |

### Critical Mitigation: Message Reactions
Reactions are the highest-risk new feature. At 10k users:
- **Problem**: 100 reactions/min × broadcast to 200-member groups = 20,000 events/min.
- **Solution**:
  1. **Batch reaction updates**: Aggregate reactions client-side, send summary every 3 seconds.
  2. **Debounce broadcasts**: Server batches reaction events per message, emits one update per 2s.
  3. **Client cache**: Store reaction counts locally, sync deltas only.

---

## 9. Deployment Checklist

### Pre-Deployment
- [ ] Run `003_messaging_groups_upgrade.sql` migration on InsForge SQL editor
- [ ] Verify all new tables are created (22 new tables)
- [ ] Verify RLS policies are active on all new tables
- [ ] Verify indexes are created (18 new indexes)
- [ ] Verify Realtime publications are enabled for interactive tables
- [ ] Seed `role_permissions` table with default permission mappings

### Application Code
- [ ] Deploy `src/types/messaging.ts` (extended type definitions)
- [ ] Deploy permission utility (`src/utils/permissions.ts`)
- [ ] Deploy group tab navigation component
- [ ] Deploy message reaction component
- [ ] Deploy call signaling service
- [ ] Deploy scheduled message manager
- [ ] Deploy sticker pack loader

### Edge Functions
- [ ] Deploy `scheduler-cron` function (reminders + scheduled messages)
- [ ] Deploy `process-media` function (compression pipeline)
- [ ] Deploy `call-signal` function (WebRTC signaling relay)

### Infrastructure
- [ ] Verify WebSocket connection limits (target: 10k concurrent per node)
- [ ] Configure TURN/STUN servers for call system
- [ ] Set up CDN for sticker packs and media thumbnails
- [ ] Configure storage bucket lifecycle (auto-delete temp uploads > 7 days)
- [ ] Set up external cron trigger (60s interval for scheduler function)

### Monitoring
- [ ] Set up alerts for WebSocket connection saturation > 80%
- [ ] Set up alerts for database connection pool exhaustion
- [ ] Set up alerts for storage egress > threshold
- [ ] Monitor reaction event throughput (target: < 5000 events/min per group)

### Rollback Plan
- [ ] All new tables use `IF NOT EXISTS` — safe to re-run
- [ ] All new columns use `ADD COLUMN IF NOT EXISTS` — safe to re-run  
- [ ] Feature flags in `campuses.feature_flags` can disable v3 features per-campus
- [ ] No existing tables or columns are modified or dropped
