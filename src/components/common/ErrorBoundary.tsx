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
                <div className="min-h-screen bg-campus-darker flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-32 h-32 bg-red-500/10 rounded-[40px] flex items-center justify-center mb-10 border border-red-500/20 shadow-glow-red animate-pulse">
                        <AlertCircle size={64} className="text-red-500" strokeWidth={3} />
                    </div>

                    <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-6">
                        System Collision Detected
                    </h1>

                    <p className="text-campus-muted text-xl font-bold uppercase tracking-widest max-w-xl mb-12 leading-relaxed">
                        A critical architecture leak or logic branch has crashed the current view.
                        The telemetry has been logged for stabilization.
                    </p>

                    <div className="flex gap-6">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-10 py-6 bg-brand-500 hover:bg-brand-600 text-white font-black uppercase tracking-widest text-sm rounded-3xl flex items-center gap-4 transition-all shadow-glow active:scale-95"
                        >
                            <RefreshCw size={24} strokeWidth={3} /> Re-Sync System
                        </button>
                        <button
                            onClick={() => window.location.href = '/app/campus'}
                            className="px-10 py-6 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-sm rounded-3xl flex items-center gap-4 transition-all hover:bg-white/10 active:scale-95"
                        >
                            <Home size={24} strokeWidth={3} /> Return to Hub
                        </button>
                    </div>

                    {import.meta.env.DEV && (
                        <pre className="mt-20 p-8 bg-black/40 rounded-3xl border border-white/5 text-red-400 text-xs font-mono text-left max-w-4xl overflow-auto custom-scrollbar italic whitespace-pre-wrap">
                            {this.state.error?.stack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
