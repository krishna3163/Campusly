# Campusly UI Stabilization & Media Interaction Architecture

## 1. Updated Component Structure & Bottom Navigation Fix
To ensure the bottom navigation and chat input bar remain completely static and resistant to virtual keyboard reflows on mobile (iOS/Android):

- **CSS Layout Strategy**: Shift from `h-screen` relying on 100vh to `h-[100dvh]` (Dynamic Viewport Height).
- **Flexbox Constraints**: 
  - Main container: `flex flex-col h-[100dvh] overflow-hidden`
  - Message List: `flex-1 overflow-y-auto overscroll-none pb-safe`
  - Input Action Bar: `shrink-0 pb-safe z-50`
- **Virtual Keyboard Handling**: Utilize `env(safe-area-inset-bottom)` to ensure the input bar floats correctly above the native iOS/Android keyboard without layout shifts.

## 2. Media Handling & Rendering Logic
When `handleFileUpload` is triggered:
- The exact MIME type must govern the `Message.type` payload (`image`, `video`, `audio`, `document`).
- **Image/Video Rendering**: The `MessageBubble` component will conditionally check `if (msg.type === 'image' && msg.media_url)` and render an `<img src={msg.media_url} loading="lazy" />` inside the bubble, rather than falling back to the default document filename display.

## 3. Camera Integration Flow
- **HTML5 native capture**: By appending the `capture="environment"` attribute to an invisible `<input type="file" accept="image/*" />` element, we can trigger the native device camera directly from the web browser/PWA.
- **Flow**: User clicks Camera -> Native OS Camera Opens -> User takes photo -> Photo passed to `handleFileUpload` -> Auto-compressed locally via `browser-image-compression` -> Uploaded encrypted via `useMediaUpload`.

## 4. Voice Recorder Architecture
To implement voice notes natively in the browser:
- Utilize `navigator.mediaDevices.getUserMedia({ audio: true })`.
- Pass the stream to a `MediaRecorder` instance.
- Build a custom UI state: `isRecording`, `recordingDuration`, with a visual waveform representation.
- On stop: Convert the recorded `Blob` to standard `.webm` or `.m4a` and trigger the multi-part upload pipeline encrypting the audio channel.

## 5. Download Manager Logic
For robust local-first media caching:
- Standard `href` downloads often break within PWA/WebView shells.
- We will fetch the object via `fetch` as a Blob, create a temporary Object URL, and programmatically invoke a hidden `<a>` download tag.
- Future enhancement: Utilize the OPFS (Origin Private File System) API to persistently cache heavy files locally, allowing offline viewing without re-downloading.

## 6. Forward, Pin, Star, & Report Logic (Action Dropdown)
- **Forward**: Opens a multi-select modal of current user conversations. Selecting chats creates a bulk insertion of cloned message payloads with a `forwarded: true` boolean.
- **Pin**: Updates the `conversations` table metadata, injecting an array of `pinned_message_ids`. The UI renders a sticky header bar displaying the pinned message contents.
- **Star**: Creates an entry in a new `starred_messages` bridging table connecting the `user_id` and `message_id`.
- **Report**: Captures the `message_id`, selected reason, and sender data; inserts into the `moderation_cases` table for the Moderator Dashboard to review.

## 7. Media Tab SQL Queries (WhatsApp-Style Info View)
When visiting a Chat Profile page, media must be loaded systematically:
```sql
-- Retrieve explicit image payloads
SELECT id, media_url, created_at 
FROM messages 
WHERE conversation_id = ? AND type = 'image' 
ORDER BY created_at DESC LIMIT 50;

-- Retrieve file documents
SELECT id, file_name, file_size, media_url 
FROM messages 
WHERE conversation_id = ? AND (type = 'document' OR type = 'file') 
ORDER BY created_at DESC;
```

## 8. Message Info Design
Triggered by long-pressing an individual message bubble:
- A bottom-sheet modal summarizes the message lifecycles.
- **Status Metrics**: `Sent Time`, `Delivered` (via push receipt), `Read Time` (via WebSocket presence acknowledgment).
- **Metadata**: Exact kilobyte size, AES-256 encryption status, and caching state.

## 9. UI Layout Correction Plan
1.  **Refactor MainLayout.tsx**: Inject `h-[100dvh]` and safe area padding map to prevent overlapping system gesture bars.
2.  **Fix ChatPage Input**: Remove absolute positioning on the input field; make it a flex sibling to the chat scroll area.
3.  **Correct Attachment Menu Toggles**: The grid menu for Document/Gallery/Camera must trigger respective HTML5 input configurations accurately.

## 10. Final System Stability Checklist
- [ ] Ensure input bar does NOT jump or hide when the keyboard opens on Safari/Chrome Mobile.
- [ ] Confirm camera button strictly opens the device camera natively.
- [ ] Fix photo rendering: images dynamically load inline rather than as file links.
- [ ] Validate that file uploads properly update the message type to `image` or `document` based on extensions.
- [ ] Verify action menus trigger appropriate toast confirmations (Pin, Star, Report).
- [ ] Ensure no duplicate renders on optimistic UI sends.
