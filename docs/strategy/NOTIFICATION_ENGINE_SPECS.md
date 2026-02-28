# Campusly - Intelligent Notification Engine Specs

## 1. Full DB Migration
The SQL database schema handles user preferences, notification tracking, and expiration logic. It guarantees offline-first safety and syncing.
Refer to `migrations/003_notifications.sql` for the full migration implementation.

## 2. Scheduler Architecture
The scheduler utilizes a cron-based engine (e.g., node-cron) attached to the background worker pool:
- **Hourly Scan**: Checks `SELECT * FROM assignments WHERE deadline < NOW() + INTERVAL '24 hours'`.
- **Thirty-Minute Scan**: Checks `SELECT * FROM exams WHERE start_time < NOW() + INTERVAL '1 hour'`.
- **Cleanup Scan**: Checks `DELETE FROM notifications WHERE expires_at < NOW()`.

## 3. Push Integration Flow
1. **Event Triggers**: An event (e.g., new assigned task) triggers a webhook.
2. **Priority Assignment**: The server evaluates the event category (`ACADEMIC`, `SOCIAL`).
3. **Preference Check**: DB is queried. If `push_enabled` = `false`, delivery is skipped.
4. **InsForge Realtime & Push**: InsForge sends the payload directly via WebSockets if online.
5. **FCM / APNs Fallback**: Sends a secure push payload to devices for background awakening.

## 4. Priority Evaluation Pseudocode
```javascript
function evaluatePriority(event, userPrefs, examModeActive) {
    if (event.type === 'SECURITY_ALERT' || (event.type === 'EXAM_REMINDER' && event.timeToNext < 1)) return 'CRITICAL';
    if (examModeActive) {
        if (event.category === 'SOCIAL') return 'SILENT';
        if (event.category === 'ACADEMIC') return 'CRITICAL';
    }
    // Behavioral weighting
    let behavioralScore = getUserBehavioralScore(event.category);
    if (behavioralScore < 0.2) return 'LOW';
    return event.defaultPriority;
}
```

## 5. Batching Algorithm Logic
```javascript
const batchWindowMs = 5 * 60 * 1000;
function processBatch(userId, category) {
    const batchedEvents = popEventsFromRedis(userId, category, batchWindowMs);
    if (batchedEvents.length === 1) return dispatchPush(batchedEvents[0]);
    if (batchedEvents.length > 1) {
        return dispatchPush({
            title: `You have ${batchedEvents.length} new ${category} updates`,
            body: 'Tap to view your latest notifications.',
            priority: 'MEDIUM',
            stacked: true
        });
    }
}
```

## 6. Exam Mode Override Logic
- During Exam Mode (enabled manually or via calendar sync), the `Notification Engine` wraps standard dispatch logic.
- Casual/Social pings are re-routed to a secondary silent queue (`priority = SILENT`).
- The primary Academic pings are hardcoded to `priority = CRITICAL` and badge coloring is set to red instead of primary brand color.

## 7. Deep Link Routing Logic
All notifications include `target_route` and `target_id`.
```javascript
const handleNotificationClick = (metadata) => {
    switch(metadata.type) {
        case 'GROUP_MENTION': navigate(`/app/chats/${metadata.target_id}`); break;
        case 'ASSIGNMENT_REMINDER': navigate(`/app/study/assignments/${metadata.target_id}`); break;
        case 'PLACEMENT_EVENT': navigate(`/app/placements/${metadata.target_id}`); break;
        default: navigate('/app/notifications');
    }
}
```

## 8. Notification Preference UI Layout
Under `Settings -> Notifications`:
- **Global Toggles**: Enable/Disable Push, Email, In-App.
- **Smart Filters**: "Enable Exam Mode Auto-Filter" (Checkbox).
- **Quiet Hours**: Time slider for DND selection.
- **Category Sliders**: Academic (High/Low volume), Social (Mentions only / All).
- **Mute List**: Visual grid of muted groups and users with easy "Unmute" buttons.

## 9. Load Simulation for 10k Users
Using standard queueing (e.g., BullMQ + Redis):
- **Scenario**: College admin sends a "SYSTEM ANNOUNCEMENT" to 10k users.
- **Execution**:
  - `admin.dispatch()` creates 1 job in Redis.
  - Workers fetch chunks of 500 users.
  - InsForge DB insertions hit multi-row `INSERT` for performance.
  - Push tasks use FCM multicasting arrays (up to 500 tokens per API call).
  - **Expected Time**: ~1.5 seconds for complete fan-out.

## 10. Performance Impact Analysis
- **Database**: The `is_read` and `expires_at` indexes ensure standard queries `(user_id = $1 AND is_read = false)` return in < 5ms.
- **Background Sync**: Polling is eliminated by leveraging InsForge WebSockets (`realtime`).
- **Memory footprint**: Offline-first client cache uses IndexedDB and purges messages older than 3 weeks to prevent app bloat.
- **Encryption constraint**: Content bodies (if sensitive) are stored encrypted, preventing server-side indexing on the `body` column, but ensuring 100% privacy check success.
