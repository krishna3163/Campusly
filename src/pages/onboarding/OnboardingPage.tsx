import { useState, useEffect } from 'react';
import { useUser } from '@insforge/react';
import { useNavigate } from 'react-router-dom';
import { insforge } from '../../lib/insforge';
import { gamificationService } from '../../services/gamificationService';
import {
    GraduationCap,
    BookOpen,
    Users,
    ChevronRight,
    ChevronLeft,
    Copy,
    Check,
    Sparkles,
    Building2,
    Zap,
    Share2,
} from 'lucide-react';

const BRANCHES = [
    'Computer Science', 'Information Technology', 'Electronics', 'Electrical',
    'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Mathematics',
    'Physics', 'Commerce', 'Arts', 'Management', 'Law', 'Medicine', 'Other',
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function OnboardingPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Step 1 state
    const [campuses, setCampuses] = useState<Array<{ id: string; name: string; university?: string; city?: string }>>([]);
    const [selectedCampus, setSelectedCampus] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedSemester, setSelectedSemester] = useState<number>(0);
    const [campusSearch, setCampusSearch] = useState('');

    // Step 3 state
    const [referralCode, setReferralCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCampuses();
    }, []);

    useEffect(() => {
        if (user?.id) {
            setReferralCode(gamificationService.generateReferralCode(user.id));
        }
    }, [user?.id]);

    const loadCampuses = async () => {
        try {
            const { data } = await insforge.database
                .from('campuses')
                .select('id, name, university, city')
                .order('name');
            if (data) setCampuses(data as Array<{ id: string; name: string; university?: string; city?: string }>);
        } catch (err) {
            console.error('Error loading campuses:', err);
        }
    };

    const handleStep2 = async () => {
        if (!user?.id || !selectedCampus) return;
        setSaving(true);

        try {
            // Update profile with campus, branch, semester
            await insforge.database
                .from('profiles')
                .update({
                    campus_id: selectedCampus,
                    branch: selectedBranch,
                    semester: selectedSemester,
                    referral_code: referralCode,
                })
                .eq('id', user.id);

            // Auto-join semester group
            const groupName = `${selectedBranch} - Sem ${selectedSemester}`;
            const { data: existingGroup } = await insforge.database
                .from('conversations')
                .select('id')
                .eq('name', groupName)
                .eq('type', 'subject_channel')
                .single();

            if (existingGroup) {
                await insforge.database.from('conversation_members').insert({
                    conversation_id: (existingGroup as { id: string }).id,
                    user_id: user.id,
                    role: 'member',
                });
            }

            // Award daily login XP
            await gamificationService.awardXP(user.id, 'daily_login');

            setStep(3);
        } catch (err) {
            console.error('Onboarding step 2 error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = () => {
        navigate('/app/chats', { replace: true });
    };

    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareReferralCode = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Join me on Campusly!',
                text: `Hey! Join Campusly with my referral code: ${referralCode}`,
                url: `https://campusly.app/join?ref=${referralCode}`,
            });
        } else {
            copyReferralCode();
        }
    };

    const filteredCampuses = campuses.filter(c =>
        c.name.toLowerCase().includes(campusSearch.toLowerCase()) ||
        c.university?.toLowerCase().includes(campusSearch.toLowerCase()) ||
        c.city?.toLowerCase().includes(campusSearch.toLowerCase())
    );

    const canProceedStep1 = selectedCampus && selectedBranch && selectedSemester > 0;

    return (
        <div className="min-h-screen bg-campus-darker flex flex-col">
            {/* Progress bar */}
            <div className="w-full h-1 bg-campus-card">
                <div
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
                {/* Step Indicator */}
                <div className="flex items-center gap-3 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${s === step
                                    ? 'bg-brand-600 text-white scale-110 shadow-glow'
                                    : s < step
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-campus-card text-campus-muted border border-campus-border'
                                }`}
                        >
                            {s < step ? <Check size={16} /> : s}
                        </div>
                    ))}
                </div>

                {/* ===== STEP 1: Campus Selection ===== */}
                {step === 1 && (
                    <div className="w-full max-w-md animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
                                <Building2 size={28} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Welcome to Campusly! 🎓</h1>
                            <p className="text-campus-muted text-sm">Let's set up your campus profile</p>
                        </div>

                        {/* Campus Search */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-campus-muted uppercase tracking-wider mb-2 block">
                                    Your Campus *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search your college..."
                                    value={campusSearch}
                                    onChange={(e) => setCampusSearch(e.target.value)}
                                    className="input-field text-sm"
                                />
                                {campusSearch && (
                                    <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-campus-border bg-campus-card">
                                        {filteredCampuses.length === 0 ? (
                                            <p className="px-4 py-3 text-campus-muted text-sm">No campuses found</p>
                                        ) : (
                                            filteredCampuses.slice(0, 10).map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setSelectedCampus(c.id);
                                                        setCampusSearch(c.name);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors border-b border-campus-border/30 last:border-0 ${selectedCampus === c.id ? 'bg-brand-500/10 text-brand-400' : ''
                                                        }`}
                                                >
                                                    <p className="font-medium">{c.name}</p>
                                                    {c.city && <p className="text-[10px] text-campus-muted">{c.university} • {c.city}</p>}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Branch */}
                            <div>
                                <label className="text-xs font-semibold text-campus-muted uppercase tracking-wider mb-2 block">
                                    Branch *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {BRANCHES.map((b) => (
                                        <button
                                            key={b}
                                            onClick={() => setSelectedBranch(b)}
                                            className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${selectedBranch === b
                                                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                                    : 'bg-campus-card/50 text-campus-muted border border-campus-border/30 hover:bg-campus-card'
                                                }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Semester */}
                            <div>
                                <label className="text-xs font-semibold text-campus-muted uppercase tracking-wider mb-2 block">
                                    Semester *
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {SEMESTERS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedSemester(s)}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${selectedSemester === s
                                                    ? 'bg-brand-600 text-white shadow-glow'
                                                    : 'bg-campus-card text-campus-muted border border-campus-border hover:bg-campus-cardHover'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!canProceedStep1}
                            className="btn-primary w-full mt-8 flex items-center justify-center gap-2"
                        >
                            Continue <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {/* ===== STEP 2: Auto Join ===== */}
                {step === 2 && (
                    <div className="w-full max-w-md animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
                                <Zap size={28} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Setting Up Your Campus</h1>
                            <p className="text-campus-muted text-sm">We'll auto-connect you to these channels</p>
                        </div>

                        <div className="space-y-3">
                            {/* Semester Group */}
                            <div className="glass-card p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <GraduationCap size={20} className="text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{selectedBranch} — Sem {selectedSemester}</p>
                                    <p className="text-[11px] text-campus-muted">Semester class group</p>
                                </div>
                                <div className="badge-success text-[10px]">Auto Join</div>
                            </div>

                            {/* Campus Feed */}
                            <div className="glass-card p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <BookOpen size={20} className="text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">Campus Feed</p>
                                    <p className="text-[11px] text-campus-muted">Events, confessions, Q&A</p>
                                </div>
                                <div className="badge-success text-[10px]">Auto Join</div>
                            </div>

                            {/* Placement Hub */}
                            <div className="glass-card p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <Users size={20} className="text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">Placement Hub — {selectedBranch}</p>
                                    <p className="text-[11px] text-campus-muted">Interview prep & experiences</p>
                                </div>
                                <div className="badge-success text-[10px]">Auto Join</div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setStep(1)} className="btn-secondary flex-1 flex items-center justify-center gap-1">
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button onClick={handleStep2} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                {saving ? 'Setting up...' : 'Join All'} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 3: Invite Classmates ===== */}
                {step === 3 && (
                    <div className="w-full max-w-md animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
                                <Sparkles size={28} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Invite Your Squad! 🚀</h1>
                            <p className="text-campus-muted text-sm">Get 5 friends to join & unlock the <span className="text-brand-400 font-semibold">"Campus Pioneer"</span> badge</p>
                        </div>

                        {/* Referral Code */}
                        <div className="glass-card p-5">
                            <p className="text-xs font-semibold text-campus-muted uppercase tracking-wider mb-3">Your Referral Code</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-campus-card border border-campus-border rounded-xl px-4 py-3 text-center">
                                    <span className="text-xl font-black tracking-[0.3em] gradient-text">{referralCode}</span>
                                </div>
                                <button
                                    onClick={copyReferralCode}
                                    className="w-12 h-12 rounded-xl bg-campus-card border border-campus-border flex items-center justify-center hover:bg-campus-cardHover transition-colors"
                                >
                                    {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} className="text-campus-muted" />}
                                </button>
                            </div>

                            <button
                                onClick={shareReferralCode}
                                className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-sm"
                            >
                                <Share2 size={16} /> Share Invite Link
                            </button>
                        </div>

                        {/* Badge preview */}
                        <div className="glass-card p-4 mt-4 flex items-center gap-3">
                            <div className="text-3xl">🏕️</div>
                            <div>
                                <p className="font-bold text-sm">Campus Pioneer Badge</p>
                                <p className="text-[11px] text-campus-muted">Invite 5 classmates who join • +25 XP each</p>
                            </div>
                            <div className="ml-auto">
                                <div className="text-xs font-bold text-amber-400">0/5</div>
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            className="btn-secondary w-full mt-8 text-sm"
                        >
                            Skip for now — Enter Campusly →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
