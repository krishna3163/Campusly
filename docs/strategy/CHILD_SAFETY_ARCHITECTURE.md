# Campusly Child Safety & Content Moderation Architecture

## 1. Banned Keyword System Design
- **Data Structure**: Fast localized Bloom Filter loaded in the Web Worker to match substrings effectively without blocking the main thread.
- **Trie Implementation**: The core engine uses a Trie (Aho-Corasick) algorithm to quickly scan text for hundreds of banned words in `O(n)` time.
- **Categorization**: Keywords grouped by severity (`mild`, `explicit`, `hate_speech`, `self_harm`).
- **Obfuscation Detection**: Leetspeak normalization (e.g., `@` -> `a`, `1` -> `l`, `$` -> `s`) applied *before* dictionary checking.

## 2. NLP Moderation Logic
- **Pre-processing**: Messages stripped of punctuation, normalized, and tokenized natively.
- **Hybrid Architecture**: 
  - *Fast Pass (On-Device)*: Local regex and basic keyword Bloom Filters. Keeps server costs zero.
  - *Deep Pass (Cloud)*: If the message hits a "yellow zone" risk score, it's routed to an NLP moderation model via InsForge Edge Functions.
- **Context Windows**: Analyzes not just single messages, but sliding windows (last 5 messages) to detect escalating abusive intent.

## 3. Media Scanning Pipeline
- **Upload Interception**: When a user selects an image, a low-res thumbnail is generated on-device.
- **Edge AI Evaluation**: 
  - Send the thumbnail to standard safety APIs (e.g., Azure Content Moderator or AWS Rekognition).
  - Explicit Content Confidence Score is returned. If >85%, the file upload is blocked *before* it hits the storage bucket.
- **Video Sampling**: For videos, the client extracts 1 frame every 3 seconds natively using an offscreen canvas. These micro-frames are batched and scanned.

## 4. Minor Protection Enforcement Logic
- **DB Schema Updates**: Add `date_of_birth` (encrypted), `age_bracket` (e.g., `U13`, `13_17`, `18+`), and `safety_mode_locked` to the `profiles` table.
- **RLS Policies**: Row Level Security prevents any `18+` user from querying the profiles of `13_17` users unless they share mutual verified groups/classes.
- **DM Gatekeeper**: Before creating a direct conversation, backend checks: `if (sender.isAdult && recipient.isMinor && !sharedContext) throw "Safety Policy Violation"`.
- **Feature Toggles**: If `is_minor === true`, UI components for "Share Location", "Voice Call", and external browser previews are conditionally omitted.

## 5. Strike System Implementation
- **Data Store**: `moderation_strikes` table tracking `user_id`, `violation_type`, `severity_score`, `timestamp`.
- **Automated Escalation**:
  - `score < 10`: Silent flag, shadow-ban visibility.
  - `score 10-25` (1st Offense): Warning modal UI.
  - `score 26-50` (2nd Offense): `can_message` = false for 24 hours via RLS.
  - `score 51-99` (3rd Offense): 7-day shadow ban / read-only mode.
  - `score 100+`: Account permanently banned, device fingerprint blacklisted.

## 6. Moderator Dashboard UI
- **Architecture**: A separate protected route (`/app/admin/safety`) accessible only by users with `role: 'moderator' | 'admin' | 'cso'`.
- **Components**:
  - **Live Queue**: Real-time feed of flagged content sorted by AI risk score.
  - **Context Viewer**: Shows the flagged message with 3 messages before and after for context (redacting media if extreme).
  - **Action Panel**: Buttons for [Dismiss], [Warn User], [Delete Content], [Suspend Account].
  - **Audit Log**: Searchable history of all moderator actions.

## 7. Link Scanning Logic
- **Pre-flight Check**: Intercept clicks on links in chat.
- **Reputation API**: Send domain to Google Safe Browsing API or custom blocklist.
- **Interstitial Warning**: "You are leaving Campusly to a potentially unsafe site. Continue?"
- **Minor Lockdown**: If `is_minor === true`, the link is strictly blocked if not on an allowlist (e.g., `.edu` domains).

## 8. Anti-Grooming Detection Pseudocode
```javascript
async function evaluateGroomingRisk(senderId, recipientId, messageHistory) {
  if (!isAdult(senderId) || isAdult(recipientId)) return 0;
  
  let riskScore = 0;
  const timeWindow = 24 * 60 * 60 * 1000;
  
  const recentMsgs = messageHistory.filter(m => m.timestamp > Date.now() - timeWindow);
  if (recentMsgs.length > 50) riskScore += 20; // High frequency
  
  const groomingPatterns = ["don't tell your parents", "send a pic", "where do you live", "are you alone"];
  
  for (const msg of recentMsgs) {
     if (containsRegex(msg.text, personalInfoRegex)) riskScore += 30;
     if (containsAny(msg.text, groomingPatterns)) riskScore += 50;
  }
  
  if (riskScore >= 80) {
     await insertModerationCase(senderId, recipientId, 'grooming_suspected');
     await triggerSafetyAlert(recipientId);
  }
  return riskScore;
}
```

## 9. Age-Based Permission Matrix

| Feature | Minor (U18) | Adult (18+) |
| :--- | :--- | :--- |
| **Direct Messaging** | Only verified peers / shared groups | Anyone |
| **Media Uploads** | Strict Safe-Search API filtering | Standard filtering |
| **Public Profile** | Hidden from global search | Visible based on settings |
| **Location Sharing** | Disabled | Opt-in |
| **External Links** | Allowlist only (`.edu`, etc) | Warn on suspicious |
| **Safe Mode Toggle**| Locked to ON | User selectable |

## 10. Performance Impact Report
- **Latency Overheads**:
  - Bloom Filter (On-device Text): `< 2ms` delay (imperceptible).
  - AI Text Scan (Edge Node): `~40-80ms` (run async to not block send UX).
  - Image Safety Check: `~300-600ms` (during file upload phase, UI shows bounded loading state).
- **Scalability Strategies**:
  - Shift local regex parsing to the client device to reduce server compute load.
  - Only route to cloud AI if the local Bloom Filter hits an anomaly.
- **Encryption Compliance**: 
  - **Crucial Note:** E2E encrypted chats *cannot* be scanned by the server. To maintain true E2E encryption while offering child safety, the Keyword & NLP checking MUST run exclusively on-device via local TensorFlow.js models. If a severe violation occurs, the victim's device auto-generates a decrypted report string to moderation.
