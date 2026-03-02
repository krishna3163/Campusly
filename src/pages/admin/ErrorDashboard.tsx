import React, { useState, useEffect } from 'react';
import { insforge } from '../../lib/insforge';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Search,
    ShieldAlert,
    Terminal,
    RefreshCw,
    Clock,
    Activity
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface ErrorLog {
    id: string;
    message: string;
    stack?: string;
    route: string;
    severity: string;
    environment: string;
    resolved: boolean;
    recurring_count: number;
    created_at: string;
    user_id?: string;
    metadata?: any;
    device_info?: any;
}

export default function ErrorDashboard() {
    const { showToast } = useAppStore();
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = insforge.database
                .from('error_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter === 'unresolved') {
                query = query.eq('resolved', false);
            } else if (filter === 'critical') {
                query = query.eq('severity', 'error');
            }

            const { data, error } = await query;
            if (error) throw error;
            setLogs(data as ErrorLog[]);
        } catch (err) {
            showToast('Failed to sync telemetry', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resolveLog = async (id: string) => {
        try {
            const { error } = await insforge.database
                .from('error_logs')
                .update({ resolved: true })
                .eq('id', id);

            if (error) throw error;
            setLogs(prev => prev.map(l => l.id === id ? { ...l, resolved: true } : l));
            showToast('Anomaly resolved', 'success');
        } catch (err) {
            showToast('Resolution failed', 'error');
        }
    };

    const filteredLogs = logs.filter(l =>
        l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.route || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const recurringSummary = [...logs]
        .sort((a, b) => (b.recurring_count || 0) - (a.recurring_count || 0))
        .slice(0, 5);

    return (
        <div className="h-full bg-campus-darker overflow-hidden flex flex-col">
            {/* Header */}
            <header className="px-10 py-8 border-b border-white/[0.03] bg-campus-dark/40 backdrop-blur-3xl flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-glow-red/20">
                        <ShieldAlert className="text-red-500" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Telemetry Command</h1>
                        <p className="text-[10px] font-black text-campus-muted uppercase tracking-[0.3em] mt-2">Real-time Anomaly Monitoring • {logs.length} Vectors</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-campus-muted" size={18} />
                        <input
                            placeholder="Scan by route or signature..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-brand-500 outline-none transition-all w-80 italic font-medium"
                        />
                    </div>
                    <button onClick={fetchLogs} className="p-4 bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white rounded-2xl border border-brand-500/10 transition-all active:scale-95 shadow-glow-brand/10">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden grid grid-cols-12 gap-0">
                {/* Sidebar Stats & Filters */}
                <aside className="col-span-3 border-r border-white/[0.03] p-10 space-y-12 overflow-y-auto custom-scrollbar bg-black/20">
                    <div>
                        <h3 className="text-[10px] font-black text-campus-muted uppercase tracking-[0.4em] mb-8 px-2 flex items-center gap-3">PULSE GROUPS</h3>
                        <div className="space-y-3">
                            {([
                                { id: 'unresolved', label: 'Unresolved Anomalies', icon: AlertCircle, color: 'text-orange-400' },
                                { id: 'critical', label: 'Critical Crashes', icon: ShieldAlert, color: 'text-red-400' },
                                { id: 'all', label: 'Historical Registry', icon: Clock, color: 'text-blue-400' }
                            ]).map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setFilter(item.id as any)}
                                    className={`w-full p-6 rounded-[28px] flex items-center gap-6 transition-all border ${filter === item.id ? 'bg-white/10 border-white/10 shadow-elevation-2' : 'hover:bg-white/5 border-transparent text-campus-muted hover:text-white'}`}
                                >
                                    <item.icon size={20} className={filter === item.id ? item.color : ''} />
                                    <span className="font-black italic uppercase tracking-widest text-[10px]">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black text-campus-muted uppercase tracking-[0.4em] mb-8 px-2 flex items-center gap-3 italic">TOP RECURRING</h3>
                        <div className="space-y-4">
                            {recurringSummary.map(log => (
                                <div key={log.id} className="p-6 bg-white/[0.01] border border-white/[0.03] rounded-[32px] hover:bg-white/[0.03] transition-all cursor-crosshair">
                                    <p className="text-[11px] font-black text-white mb-3 line-clamp-1 italic uppercase tracking-tight">{log.message}</p>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-campus-muted tracking-[0.15em]">
                                        <span className="bg-white/5 px-2 py-1 rounded-md">{log.recurring_count || 1} DETECTIONS</span>
                                        <span className="text-brand-400">{log.route || '/HUB'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Log List */}
                <section className="col-span-9 overflow-y-auto p-12 custom-scrollbar space-y-6">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 w-full bg-white/[0.02] rounded-[40px] animate-pulse border border-white/5" />
                        ))
                    ) : filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10">
                            <Activity size={100} strokeWidth={1} className="mb-8" />
                            <p className="font-black italic uppercase tracking-[0.5em] text-sm">Static Environment • Zero Deviations</p>
                        </div>
                    ) : (
                        filteredLogs.map(log => (
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className={`group p-8 rounded-[48px] border transition-all duration-500 cursor-pointer relative overflow-hidden ${log.resolved ? 'bg-white/[0.01] border-white/5 opacity-40' : 'bg-campus-dark border-white/10 hover:border-brand-500/30 hover:bg-white/[0.02] shadow-elevation-1'}`}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex-1 pr-12">
                                        <div className="flex items-center gap-5 mb-6">
                                            <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${log.severity === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-glow-red/10' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                {log.severity}
                                            </span>
                                            <span className="text-[10px] font-black text-campus-muted uppercase tracking-[0.2em] italic">{log.route || '/UNKNOWN_SECTOR'}</span>
                                            <span className="text-[10px] font-bold text-campus-muted opacity-30 tracking-widest">• {new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase line-clamp-2 leading-tight group-hover:text-brand-400 transition-colors">{log.message}</h4>
                                    </div>
                                    <div className="flex items-center gap-5 pt-4">
                                        {!log.resolved && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); resolveLog(log.id); }}
                                                className="p-5 bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white rounded-[24px] border border-brand-500/20 transition-all hover:shadow-glow-brand/30 active:scale-90"
                                            >
                                                <CheckCircle2 size={24} strokeWidth={3} />
                                            </button>
                                        )}
                                        <div className="p-5 bg-white/5 rounded-[24px] group-hover:bg-brand-500/20 transition-all transform group-hover:translate-x-1">
                                            <ChevronRight size={24} className="text-campus-muted group-hover:text-white" strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </section>
            </main>

            {/* Log Detail Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl p-12 flex justify-end" onClick={() => setSelectedLog(null)}>
                        <motion.div
                            initial={{ x: 600, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 600, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-5xl bg-campus-dark border-l border-white/10 p-16 overflow-y-auto custom-scrollbar h-full shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                <Terminal size={400} />
                            </div>

                            <header className="flex justify-between items-center mb-16">
                                <div>
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Anomaly Trace</h2>
                                    <p className="text-xs font-black text-brand-400 uppercase tracking-[0.5em] mt-2">Vector ID: {selectedLog.id}</p>
                                </div>
                                <button onClick={() => setSelectedLog(null)} className="p-6 bg-white/5 rounded-3xl hover:bg-red-500/20 text-campus-muted hover:text-red-400 transition-all active:scale-95 border border-white/5"><AlertCircle size={32} strokeWidth={3} /></button>
                            </header>

                            <div className="space-y-12 relative z-10">
                                <div className="p-12 bg-white/[0.02] border border-white/5 rounded-[56px] space-y-10 shadow-elevation-1">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 italic font-black text-3xl text-red-500 shadow-glow-red/10">ERR</div>
                                        <div>
                                            <p className="text-[11px] font-black text-campus-muted uppercase tracking-[0.4em] mb-2 font-black italic">Broadcast Signature</p>
                                            <p className="text-2xl font-black text-white italic leading-tight">{selectedLog.message}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-10 pt-10 border-t border-white/[0.05]">
                                        <div>
                                            <p className="text-[10px] font-black text-campus-muted uppercase tracking-[0.3em] mb-3">Zone</p>
                                            <p className="text-sm font-black text-brand-400 uppercase italic tracking-widest">{selectedLog.route || 'GLOBAL'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-campus-muted uppercase tracking-[0.3em] mb-3">State</p>
                                            <p className="text-sm font-black text-purple-400 uppercase italic tracking-widest">{selectedLog.environment}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-campus-muted uppercase tracking-[0.3em] mb-3">Detections</p>
                                            <p className="text-sm font-black text-amber-500 uppercase italic tracking-widest">{selectedLog.recurring_count || 1} Instances</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black text-campus-muted uppercase tracking-[0.5em] mb-8 flex items-center gap-4 italic">
                                        <Terminal size={18} className="text-brand-500" /> Stack Telemetry
                                    </h3>
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-brand-500/20 rounded-[36px] blur opacity-20 group-hover:opacity-40 transition-opacity" />
                                        <pre className="relative p-10 bg-black/60 rounded-[32px] border border-white/5 text-red-400/90 text-xs font-mono overflow-auto italic scroll-smooth leading-relaxed shadow-2xl max-h-[400px]">
                                            {selectedLog.stack || 'NO_TRACE_CAPTURED::SAFE_EXIT_OR_ASSET_FAILURE'}
                                        </pre>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-12">
                                    <div className="glass-card p-10 bg-white/[0.01] border border-white/5 rounded-[48px]">
                                        <h3 className="text-[10px] font-black text-campus-muted uppercase tracking-[0.5em] mb-8 flex items-center gap-4">
                                            <Activity size={18} className="text-cyan-400" /> Unit Specs
                                        </h3>
                                        <div className="space-y-4">
                                            {Object.entries(selectedLog.device_info || {}).map(([k, v]) => (
                                                <div key={k} className="flex justify-between py-4 border-b border-white/[0.02]">
                                                    <span className="text-[10px] font-black text-campus-muted uppercase tracking-[0.2em]">{k}</span>
                                                    <span className="text-[11px] font-black text-white italic uppercase tracking-wider">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="glass-card p-10 bg-white/[0.01] border border-white/5 rounded-[48px]">
                                        <h3 className="text-[10px] font-black text-campus-muted uppercase tracking-[0.5em] mb-8 italic">Metadata Registry</h3>
                                        <div className="p-8 bg-black/20 rounded-3xl border border-white/5 h-64 overflow-auto custom-scrollbar font-mono text-[10px] text-white/40 leading-relaxed italic">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10">
                                    {!selectedLog.resolved && (
                                        <button
                                            onClick={() => resolveLog(selectedLog.id)}
                                            className="w-full py-8 bg-brand-500 hover:bg-brand-600 text-white font-black uppercase tracking-[0.3em] rounded-[32px] shadow-glow-brand transition-all active:scale-95 italic flex items-center justify-center gap-4"
                                        >
                                            <CheckCircle2 size={24} strokeWidth={3} /> Finalize Resolution Protocol
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
