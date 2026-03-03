import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { ErrorLogger } from '../../services/ErrorLogger';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
        // Telemetry is already handled by window.onerror in ErrorLogger, 
        // but we can add specific ErrorBoundary context here.
        ErrorLogger.incrementFeatureError('global_boundary');
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-screen bg-[var(--background,#0D0D12)] flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-24 h-24 bg-[#FF9500]/10 rounded-[32px] flex items-center justify-center mb-8 border border-[#FF9500]/20">
                        <AlertCircle size={48} className="text-[#FF9500]" strokeWidth={2} />
                    </div>

                    <h1 className="text-2xl font-bold text-[var(--foreground,white)] mb-3">
                        Something went wrong
                    </h1>

                    <p className="text-[var(--foreground-muted,#8E8E93)] text-base max-w-md mb-8 leading-relaxed">
                        An unexpected error occurred. This has been logged automatically. Try refreshing the page.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={() => { this.setState({ hasError: false, error: undefined }); }}
                            className="px-8 py-3 bg-[#007AFF] hover:bg-[#0066DD] text-white font-semibold text-sm rounded-2xl flex items-center gap-3 transition-all active:scale-95"
                        >
                            <RefreshCw size={18} /> Try Again
                        </button>
                        <button
                            onClick={() => window.location.href = '/app/campus'}
                            className="px-8 py-3 bg-[var(--surface,#1A1A2E)]/50 border border-[var(--border,#2A2A3E)] text-[var(--foreground,white)] font-semibold text-sm rounded-2xl flex items-center gap-3 transition-all hover:bg-[var(--surface,#1A1A2E)] active:scale-95"
                        >
                            <Home size={18} /> Go Home
                        </button>
                    </div>

                    {import.meta.env.DEV && (
                        <pre className="mt-12 p-6 bg-black/30 rounded-2xl border border-white/5 text-red-400 text-xs font-mono text-left max-w-2xl overflow-auto whitespace-pre-wrap">
                            {this.state.error?.stack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
