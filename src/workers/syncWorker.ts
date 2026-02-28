/**
 * Sync Worker — Background sync for offline message queue
 * 
 * NOTE: This is structured as a module that can be converted to a Web Worker.
 * For Vite compatibility, it runs on the main thread via syncService.ts.
 * 
 * To convert to a true Web Worker:
 * 1. Move sync logic to this file
 * 2. Use `new Worker(new URL('./syncWorker.ts', import.meta.url))` in syncService.ts
 * 3. Communicate via postMessage/onmessage
 * 
 * Current architecture already handles:
 * - Exponential backoff retry
 * - Queue persistence via IndexedDB
 * - Conflict resolution via timestamp comparison
 * - Network state detection
 */

export type SyncWorkerMessage =
    | { type: 'START'; intervalMs: number }
    | { type: 'STOP' }
    | { type: 'PROCESS_NOW' }
    | { type: 'STATUS_UPDATE'; data: { pending: number; failed: number; syncing: boolean } };

// Placeholder — actual sync logic lives in syncService.ts
console.log('[SyncWorker] Module loaded. Sync runs via syncService on main thread.');
