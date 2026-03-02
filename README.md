# Campusly — The Unified Student Operating System

Campusly is a high-performance, privacy-first digital layer for modern university ecosystems. Engineered for 5k+ concurrent users, it bridges high-fidelity social interaction with critical academic workflows.

---

## 🏛️ System Architecture

### 1. Robust Service & Hook Layer
*   **Decoupled Logic:** UI → Hooks → Services → Backend (InsForge). No direct DB access in UI.
*   **Atomic Operations:** All database writes are wrapped in try/catch with automatic rollback patterns in optimistic UI updates.
*   **Sync Logic:** Background polling and WebSocket-ready listeners for real-time engagement.

### 2. Gesture Engine (`Stabilized 1.0`)
*   **Priority Hierarchy:** Global `GestureManager` resolves conflicts between vertical scroll, voice recording, and horizontal navigation.
*   **Lock System:** High-priority gestures (e.g., Edge Back, Swipe Reply) lock the system to prevent jitter.
*   **Conflict Resolution:**
    *   `Edge Back` > `Scroll`
    *   `Voice Record` > `Swipe`
    *   `Tab Swipe` disabled during active `Input Focus`.

### 3. Production Status Lifecycle
*   **Auto-Expiry:** Stories strictly expire after 24h via `gt(expires_at, now)`.
*   **Privacy Graph:** Statuses are visible ONLY to accepted mutual friends (Social Circle Isolation).
*   **Engagement Tracking:** Views, reactions, and screenshot logs are indexed atomically.

### 4. Competitive Feed Engine
*   **Ranking Algorithm:** `Engagement = (Upvotes * 1) + (Comments * 2) + (Reposts * 3)`.
*   **Velocity Updates:** Top 3 trending posts are computed in real-time based on the last 12h of activity.
*   **Optimistic Flow:** Broadcasts appear in <100ms globally, with background server synchronization.

---

## � Performance Benchmarks (Target)
*   **Cold Start:** < 1.4s (Vite Optimized)
*   **Chat Interaction:** < 250ms (Optimistic UI)
*   **Feed Scrolling:** Stable 60fps (Virtualization + rAF)
*   **Status Load:** < 400ms (Aggressive Caching)

---

## 🛡️ Security & Scalability
*   **RBAC:** Role-Based Access Control for Campus Moderators.
*   **Sanitization:** All broadcasts and messages are sanitized against XSS at the service level.
*   **Rate Limiting:** Global throttling for friend requests and high-frequency posting.

---

## 🛠️ Production Readiness Status
| Module | State | Priority |
| :--- | :--- | :--- |
| **Messaging** | ✅ STABLE | P0 |
| **Status Hub** | ✅ STABLE | P0 |
| **Campus Feed** | ✅ STABLE | P0 |
| **Friend Graph** | ✅ STABLE | P1 |
| **Gesture Engine** | ✅ STABLE | P1 |
| **Analytics Hub** | 🛠️ ALPHA | P3 |

---

## �️ Roadmap
- [ ] **P2P Transfer:** Zero-data local file sharing for study notes.
- [ ] **AI-Summaries:** Automatic lecture summary generator.
- [ ] **Placement CRM:** Track interview stages and offer letters.

---
*Developed with architectural precision for the modern student.*
