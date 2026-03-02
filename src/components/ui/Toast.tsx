/**
 * Toast — Global toast notification component
 */

import { useAppStore } from '../../stores/appStore';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast() {
    const { toasts, removeToast } = useAppStore();
    const toast = toasts[0];

    if (!toast) return null;

    const configs: Record<string, any> = {
        success: {
            icon: CheckCircle2,
            bg: 'bg-emerald-500/15 border-emerald-500/30',
            text: 'text-emerald-400',
        },
        error: {
            icon: AlertTriangle,
            bg: 'bg-red-500/15 border-red-500/30',
            text: 'text-red-400',
        },
        info: {
            icon: Info,
            bg: 'bg-brand-500/15 border-brand-500/30',
            text: 'text-brand-400',
        },
    };

    const config = configs[toast.type as string] || configs.info;

    const Icon = config.icon;

    return (
        <div className="fixed top-20 md:top-6 left-1/2 -translate-x-1/2 z-[1000] animate-slide-down max-w-[90vw] md:max-w-sm w-full px-4">
            <div className={`${config.bg} border backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg`}>
                <Icon size={18} className={config.text} />
                <span className={`text-sm font-medium ${config.text} flex-1`}>{toast.message}</span>
                <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                    <X size={14} className="text-campus-muted" />
                </button>
            </div>
        </div>
    );
}
