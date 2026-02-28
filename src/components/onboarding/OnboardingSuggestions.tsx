import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { generateSuggestions, recordSuggestionAction, completeOnboarding } from '../../services/suggestionEngine';
import { sendFriendRequest } from '../../services/friendService';
import type { UserProfile } from '../../types';
import type { UserSuggestion } from '../../types/social';
import {
    UserPlus,
    X,
    Crown,
    Sparkles,
    ArrowRight,
    Check,
} from 'lucide-react';

interface Props {
    profile: UserProfile;
    onComplete: () => void;
}

export default function OnboardingSuggestions({ profile, onComplete }: Props) {
    const { user } = useUser();
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState<Set<string>>(new Set());
    const [step, setStep] = useState(1);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        if (!user?.id) return;
        setLoading(true);
        const results = await generateSuggestions(user.id, profile, 15);
        setSuggestions(results);
        setLoading(false);
    };

    const handleConnect = async (suggestion: UserSuggestion) => {
        if (!user?.id) return;
        await sendFriendRequest(user.id, suggestion.user.id);
        await recordSuggestionAction(user.id, suggestion.user.id, 'connected');
        setConnected(prev => new Set([...prev, suggestion.user.id]));
    };

    const handleDismiss = async (suggestion: UserSuggestion) => {
        if (!user?.id) return;
        await recordSuggestionAction(user.id, suggestion.user.id, 'dismissed');
        setSuggestions(prev => prev.filter(s => s.user.id !== suggestion.user.id));
    };

    const handleFinish = async () => {
        if (user?.id) {
            await completeOnboarding(user.id);
        }
        onComplete();
    };

    const getReasonLabel = (reason: string) => {
        const labels: Record<string, string> = {
            same_semester: '📚 Your Classmate',
            same_branch: '🎓 Same Branch',
            same_campus: '🏫 Same Campus',
            admin: '👑 Campus Admin',
            top_contributor: '⭐ Top Contributor',
            active_user: '🔥 Recently Active',
            mutual_friends: '👥 Mutual Friends',
        };
        return labels[reason] || reason;
    };

    const adminSuggestion = suggestions.find(s => s.reason === 'admin');
    const classmates = suggestions.filter(s => s.reason === 'same_semester' || s.reason === 'same_branch');
    const others = suggestions.filter(s => s.reason !== 'admin' && s.reason !== 'same_semester' && s.reason !== 'same_branch');

    return (
        <div className="fixed inset-0 z-[200] bg-campus-darker flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="w-full max-w-lg animate-scale-in">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-8 px-2">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-brand-500' : 'bg-white/10'}`} />
                    ))}
                </div>

                {step === 1 && (
                    <div className="glass-card p-10 text-center">
                        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-glow">
                            <Sparkles size={36} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-3">Welcome to Campusly!</h1>
                        <p className="text-campus-muted leading-relaxed mb-10">
                            Let's connect you with your classmates and community. We've found some people you might know.
                        </p>
                        <button onClick={() => setStep(2)} className="btn-primary w-full py-4 rounded-2xl font-bold shadow-glow flex items-center justify-center gap-2">
                            Let's Go <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="glass-card p-8">
                        <h2 className="text-xl font-black text-white mb-2">People You May Know</h2>
                        <p className="text-sm text-campus-muted mb-6">Connect with classmates and contributors</p>

                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                                {/* Admin first */}
                                {adminSuggestion && (
                                    <SuggestionCard
                                        suggestion={adminSuggestion}
                                        isConnected={connected.has(adminSuggestion.user.id)}
                                        onConnect={() => handleConnect(adminSuggestion)}
                                        onDismiss={() => handleDismiss(adminSuggestion)}
                                        reasonLabel={getReasonLabel(adminSuggestion.reason)}
                                        isAdmin
                                    />
                                )}

                                {/* Classmates */}
                                {classmates.map(s => (
                                    <SuggestionCard
                                        key={s.user.id}
                                        suggestion={s}
                                        isConnected={connected.has(s.user.id)}
                                        onConnect={() => handleConnect(s)}
                                        onDismiss={() => handleDismiss(s)}
                                        reasonLabel={getReasonLabel(s.reason)}
                                    />
                                ))}

                                {/* Others */}
                                {others.map(s => (
                                    <SuggestionCard
                                        key={s.user.id}
                                        suggestion={s}
                                        isConnected={connected.has(s.user.id)}
                                        onConnect={() => handleConnect(s)}
                                        onDismiss={() => handleDismiss(s)}
                                        reasonLabel={getReasonLabel(s.reason)}
                                    />
                                ))}
                            </div>
                        )}

                        <button onClick={() => setStep(3)} className="btn-primary w-full py-4 rounded-2xl font-bold shadow-glow mt-6 flex items-center justify-center gap-2">
                            Continue <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="glass-card p-10 text-center">
                        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-emerald-500 to-brand-600 flex items-center justify-center mx-auto mb-6 shadow-glow animate-scale-in">
                            <Check size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-3">You're All Set!</h1>
                        <p className="text-campus-muted leading-relaxed mb-2">
                            <span className="text-white font-bold">{connected.size}</span> connections sent
                        </p>
                        <p className="text-campus-muted text-sm leading-relaxed mb-10">
                            Start exploring your campus community. Your messages are E2E encrypted, and your data stays local-first.
                        </p>
                        <button onClick={handleFinish} className="btn-primary w-full py-4 rounded-2xl font-bold shadow-glow">
                            Enter Campusly 🚀
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function SuggestionCard({
    suggestion,
    isConnected,
    onConnect,
    onDismiss,
    reasonLabel,
    isAdmin,
}: {
    suggestion: UserSuggestion;
    isConnected: boolean;
    onConnect: () => void;
    onDismiss: () => void;
    reasonLabel: string;
    isAdmin?: boolean;
}) {
    const u = suggestion.user;

    return (
        <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isAdmin ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-white/[0.03] border border-white/5 hover:bg-white/5'}`}>
            <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' : 'bg-white/10 text-white/60'}`}>
                    {u.avatar_url ? (
                        <img src={u.avatar_url} className="w-full h-full object-cover rounded-2xl" alt="" />
                    ) : (
                        u.display_name?.charAt(0) || '?'
                    )}
                </div>
                {isAdmin && (
                    <Crown size={12} className="absolute -top-1 -right-1 text-amber-400" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{u.display_name || 'Anonymous'}</p>
                <p className="text-[10px] text-campus-muted font-bold uppercase tracking-wider truncate">{reasonLabel}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {isConnected ? (
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <Check size={14} /> Sent
                    </div>
                ) : (
                    <>
                        <button onClick={onDismiss} className="p-2 rounded-xl text-campus-muted hover:text-white hover:bg-white/10 transition-all">
                            <X size={16} />
                        </button>
                        <button onClick={onConnect} className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-400 transition-all active:scale-90 shadow-glow">
                            <UserPlus size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
