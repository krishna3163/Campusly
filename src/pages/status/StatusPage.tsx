import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Camera,
    ChevronLeft,
    Palette,
    Sparkles,
    Shield,
    Lock,
    Eye,
    ScanLine
} from 'lucide-react';
import { UserProfile } from '../../types';
import { useStatus } from '../../hooks/useStatus';
import { useAppStore } from '../../stores/appStore';
import { StoryViewer } from '../../components/stories/StoryViewer';
import { StoryCamera } from '../../components/stories/StoryCamera';
import { StoryEditor } from '../../components/stories/StoryEditor';
import { StatusService } from '../../services/statusService';

export default function StatusPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const { viewUserId } = useParams<{ viewUserId?: string }>();
    const { showToast } = useAppStore();

    const { statuses, loading } = useStatus(user?.id);
    const [viewingUser, setViewingUser] = useState<string | null>(viewUserId || (location.state as any)?.viewUserId || null);

    // UI State
    const [showCamera, setShowCamera] = useState((location.state as any)?.openCamera || false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [capturedFile, setCapturedFile] = useState<{ file: File; type: 'image' | 'video' } | null>(null);

    useEffect(() => {
        if (viewUserId) setViewingUser(viewUserId);
    }, [viewUserId]);

    const handleNextUser = () => {
        const uids = Object.keys(statuses);
        const currentIdx = uids.indexOf(viewingUser || '');
        if (currentIdx < uids.length - 1) {
            setViewingUser(uids[currentIdx + 1]);
        } else {
            setViewingUser(null);
            navigate('/app/status', { replace: true });
        }
    };

    const handlePrevUser = () => {
        const uids = Object.keys(statuses);
        const currentIdx = uids.indexOf(viewingUser || '');
        if (currentIdx > 0) {
            setViewingUser(uids[currentIdx - 1]);
        }
    };

    return (
        <div className="h-full bg-campus-darker flex flex-col overflow-hidden relative">
            {/* Background Architecture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-500/5 via-transparent to-transparent pointer-events-none" />

            {/* Header */}
            <header className="px-8 py-10 flex items-center justify-between border-b border-white/[0.03] bg-campus-dark/40 backdrop-blur-3xl z-20 shadow-elevation-1">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl transition-all border border-white/5 active:scale-90">
                        <ChevronLeft size={28} strokeWidth={3} className="text-white" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Status Hub</h1>
                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                            <Lock size={10} /> End-to-End Encrypted
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowPrivacy(true)} className="p-4 bg-brand-500/10 hover:bg-brand-500/20 rounded-3xl text-brand-400 transition-all border border-brand-500/20 active:scale-95 shadow-glow-brand/20">
                        <Shield size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-8 py-12 custom-scrollbar scroll-smooth relative z-10">
                {/* My Status Section */}
                <div className="mb-14 max-w-2xl">
                    <h3 className="text-[10px] font-black text-campus-muted uppercase tracking-[0.4em] mb-8 px-4 flex items-center gap-4 italic">
                        <ScanLine size={16} className="text-brand-500" /> Identity Broadcast
                    </h3>
                    <div
                        onClick={() => setShowCamera(true)}
                        className="flex items-center gap-8 p-10 glass-card bg-white/[0.01] hover:bg-brand-500/5 border border-white/5 hover:border-brand-500/30 transition-all duration-500 cursor-pointer group rounded-[56px] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Camera size={80} />
                        </div>
                        <div className="relative">
                            <div className="w-24 h-24 rounded-[36px] bg-gradient-to-tr from-brand-500 via-indigo-500 to-purple-600 p-[3px] shadow-glow-brand">
                                <div className="w-full h-full rounded-[33px] bg-campus-dark flex items-center justify-center border-4 border-campus-dark overflow-hidden">
                                    {(user?.profile as any)?.avatar_url ? (
                                        <img src={(user?.profile as any).avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-black text-white italic uppercase">{(user?.profile as any)?.display_name?.charAt(0)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 p-3 bg-brand-500 rounded-2xl text-white border-4 border-campus-dark group-hover:rotate-90 transition-transform shadow-2xl">
                                <Plus size={20} strokeWidth={4} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-2xl font-black text-white italic uppercase tracking-tight group-hover:text-brand-400 transition-colors">Capture Moment</p>
                            <p className="text-[11px] font-black text-campus-muted uppercase tracking-[0.2em] opacity-60 mt-2">Visibility: Your Connections Only</p>
                        </div>
                    </div>
                </div>

                {/* Friends Updates */}
                <div className="max-w-2xl">
                    <h3 className="text-[10px] font-black text-campus-muted uppercase tracking-[0.4em] mb-8 px-4 flex items-center gap-4 italic font-black">
                        <Sparkles size={16} className="text-purple-400" /> Recent Movements
                    </h3>

                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 w-full bg-white/[0.02] border border-white/5 rounded-[56px] animate-pulse" />
                            ))}
                        </div>
                    ) : Object.keys(statuses).length === 0 ? (
                        <div className="text-center py-32 bg-white/[0.01] border border-white/5 rounded-[64px] border-dashed">
                            <Eye size={48} className="mx-auto mb-6 text-white/10" />
                            <p className="font-black italic uppercase tracking-widest text-campus-muted text-sm px-10">Static environment detected. Invite connections to broadcast updates.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(statuses).map(([uid, userStories]) => (
                                <motion.div
                                    key={uid}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    onClick={() => setViewingUser(uid)}
                                    className="flex items-center gap-8 p-8 glass-card bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-brand-500/20 transition-all duration-500 cursor-pointer group rounded-[56px]"
                                >
                                    <div className="w-20 h-20 rounded-[32px] bg-gradient-to-tr from-brand-500 via-indigo-600 to-purple-600 p-[3px] shadow-glow-sm transition-transform duration-500 group-hover:rotate-6">
                                        <div className="w-full h-full rounded-[29px] bg-campus-dark border-4 border-campus-dark flex items-center justify-center overflow-hidden">
                                            {userStories[0].user?.avatar_url ? (
                                                <img src={userStories[0].user.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-black text-brand-400 italic uppercase">{userStories[0].user?.display_name?.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <p className="text-xl font-black text-white italic uppercase tracking-tight group-hover:text-brand-400 transition-colors">{userStories[0].user?.display_name || 'STUDENT'}</p>
                                            <div className="w-2 h-2 rounded-full bg-brand-500 shadow-glow-brand" />
                                        </div>
                                        <p className="text-[10px] font-black text-campus-muted uppercase tracking-widest opacity-60 mt-1">
                                            {userStories.length} updates • {new Date(userStories[userStories.length - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-brand-500 text-white transition-all transform group-hover:translate-x-1">
                                        <ChevronLeft className="rotate-180" size={20} strokeWidth={3} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-12 right-12 flex flex-col gap-6 z-30">
                <button
                    onClick={async () => {
                        const content = prompt("Mesh broadcast (text):");
                        if (content && content.trim()) {
                            try {
                                const campusId = (user?.profile as any)?.campus_id || '00000000-0000-0000-0000-000000000000';
                                await StatusService.postText(user!.id, campusId, content);
                                showToast('Broadcast stabilized!', 'success');
                                window.location.reload(); // Quick refresh to show status
                            } catch (err) {
                                showToast('Transmission failed.', 'error');
                            }
                        }
                    }}
                    className="p-6 bg-white/5 backdrop-blur-3xl text-white rounded-[32px] border border-white/10 hover:bg-white/10 shadow-2xl transition-all active:scale-90"
                >
                    <Palette size={28} strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => setShowCamera(true)}
                    className="p-10 bg-brand-500 text-white rounded-[40px] shadow-glow-brand transition-all hover:bg-brand-600 active:scale-95 group"
                >
                    <Camera size={40} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {viewingUser && statuses[viewingUser] && (
                    <StoryViewer
                        stories={statuses[viewingUser]}
                        currentUser={{ id: user?.id, ...user?.profile } as UserProfile}
                        onClose={() => {
                            setViewingUser(null);
                            navigate('/app/status', { replace: true });
                        }}
                        onNextUser={handleNextUser}
                        onPrevUser={handlePrevUser}
                    />
                )}
                {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

                {showCamera && !capturedFile && (
                    <StoryCamera
                        onClose={() => setShowCamera(false)}
                        onCapture={(file, type) => setCapturedFile({ file, type })}
                    />
                )}

                {capturedFile && user && (
                    <StoryEditor
                        file={capturedFile.file}
                        mediaType={capturedFile.type}
                        currentUser={{ id: user.id, ...user.profile } as UserProfile}
                        onClose={() => {
                            setCapturedFile(null);
                            setShowCamera(false);
                        }}
                        onPost={() => {
                            showToast('Status Uploaded!', 'success');
                            setCapturedFile(null);
                            setShowCamera(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="w-full max-w-sm p-12 bg-campus-dark border border-white/10 rounded-[64px] shadow-glow-brand/20" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-10 flex items-center gap-4"><Shield className="text-brand-400" /> Security</h2>
                <div className="space-y-4">
                    {['My Connections Only', 'Specific Groups', 'Private Mode'].map(opt => (
                        <button key={opt} className="w-full p-8 text-left bg-white/[0.02] hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/30 rounded-[32px] transition-all flex items-center justify-between group">
                            <span className="font-black uppercase tracking-widest text-xs text-white group-hover:text-brand-400">{opt}</span>
                            <div className="w-6 h-6 rounded-lg border-2 border-white/20 group-hover:border-brand-500 group-hover:bg-brand-500/20" />
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="w-full mt-10 py-6 bg-white/5 border border-white/5 rounded-[32px] text-white font-black uppercase tracking-widest text-[10px] italic">Close Protocol</button>
            </motion.div>
        </div>
    );
}
