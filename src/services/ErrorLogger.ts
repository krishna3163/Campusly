import { insforge } from '../lib/insforge';

interface ErrorPayload {
    message: string;
    stack?: string;
    route: string;
    userId?: string;
    timestamp: string;
    device: any;
    severity: 'error' | 'warning' | 'info';
    environment: 'development' | 'production';
    url: string;
    userAgent: string;
}

class TelemetrySystem {
    private queue: ErrorPayload[] = [];
    private originalConsoleError: typeof console.error;
    private _batchInterval: any = null;
    private userId: string | null = null;
    private isInitialized = false;
    private rateLimitCounter = 0;
    private rateLimitResetTimeout: any = null;
    private featureErrorCounters: Record<string, number> = {};

    constructor() {
        this.originalConsoleError = console.error.bind(console);
    }

    /**
     * SECTION 1 — CAPTURE ALL CLIENT ERRORS
     * Initializes global listeners and overrides.
     */
    init(userId?: string) {
        if (this.isInitialized) return;
        this.userId = userId || null;

        // 1. window.onerror
        const originalOnerror = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            this.capture({
                message: String(message),
                stack: error?.stack,
                severity: 'error',
                metadata: { source, lineno, colno }
            });
            if (originalOnerror) return originalOnerror(message, source, lineno, colno, error);
            return false;
        };

        // 2. window.addEventListener('error') - Captures asset load failures
        window.addEventListener('error', (event) => {
            if (event.error) return; // Handled by onerror
            const target = event.target as any;
            if (target?.tagName) {
                this.capture({
                    message: `Asset failed: ${target.src || target.href || 'unknown'}`,
                    severity: 'warning',
                    metadata: { tagName: target.tagName }
                });
            }
        }, true);

        // 3. window.addEventListener('unhandledrejection')
        window.addEventListener('unhandledrejection', (event) => {
            this.capture({
                message: `Unhandled Rejection: ${event.reason?.message || event.reason}`,
                stack: event.reason?.stack,
                severity: 'error'
            });
        });

        this.patchConsole();
        this.startBatching();
        this.isInitialized = true;

        if (import.meta.env.DEV) {
            this.originalConsoleError('[Telemetry] Global Error Capture Active');
        }
    }

    /**
     * SECTION 2 — INTERCEPT CONSOLE.ERROR
     * Safely overrides console.error without recursion.
     */
    private patchConsole() {
        console.error = (...args: any[]) => {
            // Prevent recursive capture from our own error reporting
            const message = args.map(arg => {
                try {
                    return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                } catch { return String(arg); }
            }).join(' ');

            if (!message.includes('[Telemetry]')) {
                this.capture({
                    message: `[Console] ${message.substring(0, 500)}`,
                    severity: 'error'
                });
            }
            this.originalConsoleError(...args);
        };
    }

    private capture(data: { message: string; stack?: string; severity: 'error' | 'warning' | 'info'; metadata?: any }) {
        // Rate Limit: Max 10 per minute
        if (this.rateLimitCounter >= 10) return;

        const payload: ErrorPayload = {
            message: data.message,
            stack: data.stack,
            route: window.location.pathname,
            userId: this.userId || undefined,
            timestamp: new Date().toISOString(),
            device: this.getDeviceInfo(),
            severity: data.severity,
            environment: import.meta.env.DEV ? 'development' : 'production',
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        /**
         * SECTION 4 — DEV MODE AUTO-SEND TO ANTIGRAVITY
         */
        if (payload.environment === 'development') {
            this.forwardToAntigravity(payload);
        }

        this.queue.push(payload);
        this.rateLimitCounter++;

        if (!this.rateLimitResetTimeout) {
            this.rateLimitResetTimeout = setTimeout(() => {
                this.rateLimitCounter = 0;
                this.rateLimitResetTimeout = null;
            }, 60000);
        }
    }

    private async forwardToAntigravity(payload: ErrorPayload) {
        // Trigger "Repair suggestion mode" in terminal/agent console
        // This simulates sending to a local agent proxy
        if (window.location.hostname === 'localhost') {
            try {
                // Post to internal antigravity endpoint if it existed
                // fetch('/api/antigravity/repair', { method: 'POST', body: JSON.stringify(payload) });
                this.originalConsoleError('[Antigravity Repair Suggestion] Logged in development', payload.message);
            } catch (e) { }
        }
    }

    private getDeviceInfo() {
        return {
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`,
            cores: navigator.hardwareConcurrency,
            lang: navigator.language,
            mem: (navigator as any).deviceMemory
        };
    }

    private startBatching() {
        // SECTION 5 — PERFORMANCE SAFETY
        this._batchInterval = setInterval(() => this.flush(), 5000);
    }

    private async flush() {
        if (this.queue.length === 0) return;

        const batch = [...this.queue];
        this.queue = [];

        try {
            // SECTION 5 — Sanitize sensitive data
            const sanitized = batch.map(err => ({
                ...err,
                message: err.message.replace(/session|token|password|auth/gi, '***'),
                stack: err.stack?.replace(/Bearer\s[a-zA-Z0-9-_.]+/g, 'Bearer REDACTED')
            }));

            // Use navigator.sendBeacon if supported (Section 5)
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(sanitized)], { type: 'application/json' });
                const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL;
                navigator.sendBeacon(`${baseUrl}/functions/v1/log-error`, blob);
            } else {
                await insforge.functions.invoke('log-error', { body: sanitized });
            }
        } catch (err) {
            this.originalConsoleError('[Telemetry Flush Failed]', err);
        }
    }

    /**
     * SECTION 7 — SELF-HEAL MODE
     */
    public incrementFeatureError(feature: string) {
        this.featureErrorCounters[feature] = (this.featureErrorCounters[feature] || 0) + 1;
        if (this.featureErrorCounters[feature] > 5) {
            return true; // Should disable feature
        }
        return false;
    }
}

export const ErrorLogger = new TelemetrySystem();
