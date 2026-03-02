import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export default function ToastQueue() {
    const { toasts, removeToast } = useAppStore();

    return (
        <div className="fixed top-6 right-6 z-[3000] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="pointer-events-auto"
                    >
                        <div className={`
                            min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-4 
                            ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-brand-500/10 border-brand-500/20 text-brand-400'}
                        `}>
                            <div className="shrink-0 mt-0.5">
                                {toast.type === 'success' && <CheckCircle size={20} />}
                                {toast.type === 'error' && <AlertCircle size={20} />}
                                {toast.type === 'info' && <Info size={20} />}
                            </div>

                            <div className="flex-1 min-w-0 pr-2">
                                <p className="text-[13px] font-bold leading-relaxed">{toast.message}</p>
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 text-white/20 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
