# Campusly v4.0 — Trust, Reporting & Social Graph Architecture

## Table of Contents
1. [Bug Report Workflow](#1-bug-report-workflow)
2. [Error Logging Pipeline](#2-error-logging-pipeline)
3. [Social Graph Algorithm](#3-social-graph-algorithm)
4. [Friend System Flow](#4-friend-system-flow)
5. [Notification Integration](#5-notification-integration)
6. [Admin Dashboard Additions](#6-admin-dashboard-additions)
7. [Privacy Compliance Notes](#7-privacy-compliance-notes)

---

## 1. Bug Report Workflow

```
┌──────────┐     ┌──────────────────┐     ┌───────────────┐     ┌─────────────┐
│  User     │────▶│  Bug Report Form │────▶│  InsForge DB  │────▶│  Admin View │
│  Reports  │     │  (auto-capture)  │     │  bug_reports   │     │  Dashboard  │
│  Bug      │     │  • device_info   │     └──────┬────────┘     └──────┬──────┘
└──────────┘     │  • app_version   │            │                      │
                  │  • screenshot    │            │ Notification         │ Respond
                  └──────────────────┘            ▼                      ▼
                                           ┌───────────────┐     ┌──────────────┐
                                           │ notifications │     │ Update status │
                                           │ (Admin alert) │     │ + response   │
                                           └───────────────┘     └──────┬───────┘
                                                                        │
                                                                        ▼
                                                                 ┌──────────────┐
                                                                 │ Notify User  │
                                                                 │ (status      │
                                                                 │  changed)    │
                                                                 └──────────────┘
```

### Status Lifecycle
```
open → reviewing → resolved → closed
  │                    │
  └────── closed ◄─────┘
```

---

## 2. Error Logging Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                       │
│                                                          │
│  window.addEventListener('error', handler)               │
│  window.addEventListener('unhandledrejection', handler)  │
│                                                          │
│  On Error:                                               │
│  ├─ Capture: message, stack, device_info, last_action    │
│  ├─ If ONLINE  → POST to error_logs table                │
│  └─ If OFFLINE → Queue in localStorage                   │
│        └─ On 'online' event → flush queue to backend     │
│                                                          │
│  Last Action Tracking:                                   │
│  └─ setLastAction() called on meaningful user actions    │
│                                                          │
│  Silent: No UI interruption. No user prompt.             │
└──────────────────────────────────────────────────────────┘

Admin Access:
  └─ Admin ID can SELECT * FROM error_logs
  └─ Group by error_message for pattern detection
  └─ Filter by timestamp for regression hunting
```

---

## 3. Social Graph Algorithm

### Suggestion Scoring
```
┌─────────────────────────────────┬───────┬──────────┐
│ Signal                          │ Score │ Priority │
├─────────────────────────────────┼───────┼──────────┤
│ Same campus + branch + semester │  100  │ Highest  │
│ Campus Admin                    │   95  │ High     │
│ Same campus + same branch       │   80  │ High     │
│ Top contributors (XP)          │   70  │ Medium   │
│ Recently active (same campus)  │   50  │ Low      │
│ Mutual friends                 │   60  │ Medium   │
└─────────────────────────────────┴───────┴──────────┘
```

### Algorithm Pseudocode
```
function generateSuggestions(userId, profile):
    suggestions = []
    seenIds = {userId}
    
    // Tier 1: Direct classmates
    classmates = query profiles WHERE campus=same AND branch=same AND semester=same
    for each c in classmates: add(c, score=100, reason='same_semester')
    
    // Tier 2: Branch mates (other semesters)
    branchmates = query profiles WHERE campus=same AND branch=same AND semester≠same
    for each b in branchmates: add(b, score=80, reason='same_branch')
    
    // Tier 3: Platform admin (always)
    admin = query profiles WHERE id=ADMIN_USER_ID
    add(admin, score=95, reason='admin')
    
    // Tier 4: Top contributors
    top = query profiles ORDER BY xp DESC LIMIT 5
    for each t in top: add(t, score=70, reason='top_contributor')
    
    // Tier 5: Recently active
    active = query profiles WHERE campus=same ORDER BY last_seen DESC LIMIT 5
    for each a in active: add(a, score=50, reason='active_user')
    
    // Filter already actioned
    actioned = query user_suggestion_actions WHERE user_id=userId
    remove suggestions where suggested_user_id in actioned
    
    return sort by score DESC, limit 15
```

---

## 4. Friend System Flow

```
         User A                                    User B
           │                                         │
           │  sendFriendRequest(A, B)                │
           ├────────────────────────────────────────▶│
           │  friend_requests: status='pending'      │
           │                                    ┌────┤ Notification:
           │                                    │    │ "New Friend Request"
           │                                    │    │
           │                              ┌─────▼────┤
           │                              │ Accept   │
           │                              │ Reject   │
           │                              │ Ignore   │
           │                              └─────┬────┤
           │                                    │    │
           │  ◄── If ACCEPTED ──────────────────┤    │
           │  friend_requests: status='accepted' │    │
           │  friendships: (A, B) created        │    │
           │  Notification: "Request Accepted!"  │    │
           │                                         │
           │  ◄── If REJECTED ──────────────────┤    │
           │  friend_requests: status='rejected' │    │
           │  No notification to sender          │    │
           │                                         │
```

### Friendship Storage Rule
To avoid duplicate friendships:
- Always store sorted IDs: `user_id_1 < user_id_2`
- UNIQUE constraint on `(user_id_1, user_id_2)`
- CHECK constraint: `user_id_1 < user_id_2`

---

## 5. Notification Integration

### New Notification Types
| Type | Trigger | Title | Recipient |
|---|---|---|---|
| `friend_request` | User sends request | "👋 New Friend Request" | Receiver |
| `friend_accepted` | Request accepted | "🎉 Friend Request Accepted" | Sender |
| `bug_report` | Bug submitted | "🐛 New Bug Report: {title}" | Admin |
| `bug_report_update` | Admin responds | "🔔 Bug Report Updated" | Reporter |
| `admin_message` | Admin broadcasts | "📢 Platform Announcement" | All users |

### Integration with Existing System
All notifications use the existing `notifications` table and UI:
```sql
INSERT INTO notifications (user_id, type, title, body, data, is_read)
VALUES ($1, $2, $3, $4, $5, false);
```

---

## 6. Admin Dashboard Additions

### Admin ID: `db98f974-752b-4f66-a9ed-1dd35fcfbb93`

| Capability | How |
|---|---|
| View all bug reports | RLS policy grants SELECT on bug_reports |
| Respond to bug reports | `respondToBugReport()` in bugReportService |
| View error logs | RLS policy grants SELECT on error_logs |
| Moderate users | Existing campus_roles system |
| Broadcast announcements | Create system messages in global channels |
| Push system notifications | Insert into notifications for all users |

---

## 7. Privacy Compliance Notes

### Data Handling
| Data | Storage | Encryption | Retention |
|---|---|---|---|
| Bug reports | Server (InsForge) | At-rest encryption | Until resolved + 90 days |
| Error logs | Server (InsForge) | At-rest encryption | 30 days rolling |
| Error queue (local) | localStorage | None (device-only) | Until flushed |
| Friend graphs | Server (InsForge) | At-rest encryption | Until account deletion |
| Contact hashes | Never stored | N/A | N/A |
| Device info | Embedded in report | At-rest encryption | Same as parent record |

### GDPR/Privacy Principles
1. **Data Minimization**: Only essential device info captured (no GPS, no contacts by default).
2. **Explicit Consent**: Contact discovery is opt-in only.
3. **Right to Erasure**: Account deletion cascades to all bug_reports, error_logs, friendships.
4. **Transparency**: Auto-captured fields are clearly labeled in the bug report form.
5. **Encryption**: All data protected by InsForge's at-rest encryption. Chat data additionally E2E encrypted.

### Contact Discovery (Opt-In Only)
```
User opts in → Phone numbers hashed with SHA-256 → Hashes compared server-side
→ Matches returned → Raw numbers NEVER stored or transmitted
```
