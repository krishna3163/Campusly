import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@insforge/react';
import {
    ChevronLeft,
    AlertTriangle,
    Trash2,
    ShieldAlert
} from 'lucide-react';
import { insforge } from '../../lib/insforge';
import { useAppStore } from '../../stores/appStore';
import { deleteCookie } from '../../utils/cookie';

export default function AccountDeletionPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { signOut } = useAuth();
    const { showToast } = useAppStore();
    const [confirmText, setConfirmText] = useState('');
    const [step, setStep] = useState<'info' | 'confirm' | 'processing'>('info');

    const handleDelete = async () => {
        if (confirmText !== 'DELETE MY ACCOUNT') return;
        setStep('processing');
        try {
            // Delete user data from profiles
            if (user?.id) {
                await insforge.database.from('profiles').delete().eq('id', user.id);
            }
            await signOut();
            deleteCookie('campusly_user_id');
            deleteCookie('campusly_user_name');
            deleteCookie('campusly_user_avatar');
            navigate('/login');
        } catch {
            showToast('Failed to delete account. Try again later.', 'error');
            setStep('confirm');
        }
    };

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden">
            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 shrink-0">
                <button onClick={() => navigate(-1)} className="text-[#007AFF] flex items-center gap-1">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[17px] font-bold text-[var(--foreground)]">Delete Account</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
                {step === 'info' && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center text-center py-6">
                            <div className="w-20 h-20 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mb-4">
                                <ShieldAlert size={36} className="text-[#FF3B30]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Delete Your Account?</h2>
                            <p className="text-[15px] text-[var(--foreground-muted)] max-w-xs">This action is permanent and cannot be undone. All your data will be erased.</p>
                        </div>

                        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
                            <h3 className="text-[14px] font-bold text-[#FF3B30] uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={16} /> What you'll lose
                            </h3>
                            <ul className="space-y-3 text-[15px] text-[var(--foreground)]">
                                <li className="flex items-start gap-3"><span className="text-[#FF3B30] mt-0.5">•</span> All your posts, comments, and reactions</li>
                                <li className="flex items-start gap-3"><span className="text-[#FF3B30] mt-0.5">•</span> Your friend connections and chat history</li>
                                <li className="flex items-start gap-3"><span className="text-[#FF3B30] mt-0.5">•</span> Profile information and uploaded media</li>
                                <li className="flex items-start gap-3"><span className="text-[#FF3B30] mt-0.5">•</span> Study progress and placement data</li>
                                <li className="flex items-start gap-3"><span className="text-[#FF3B30] mt-0.5">•</span> All settings and preferences</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => setStep('confirm')}
                            className="w-full py-4 bg-[#FF3B30] text-white font-bold rounded-2xl text-[16px] active:scale-[0.98] transition-transform"
                        >
                            I understand, continue
                        </button>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Final Confirmation</h2>
                            <p className="text-[15px] text-[var(--foreground-muted)]">Type <span className="font-bold text-[#FF3B30]">DELETE MY ACCOUNT</span> to confirm.</p>
                        </div>

                        <input
                            value={confirmText}
                            onChange={e => setConfirmText(e.target.value)}
                            placeholder="Type here..."
                            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-4 text-[16px] text-[var(--foreground)] text-center font-bold outline-none focus:border-[#FF3B30]/50"
                        />

                        <button
                            onClick={handleDelete}
                            disabled={confirmText !== 'DELETE MY ACCOUNT'}
                            className="w-full py-4 bg-[#FF3B30] text-white font-bold rounded-2xl text-[16px] disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} /> Permanently Delete Account
                        </button>

                        <button
                            onClick={() => setStep('info')}
                            className="w-full py-3 text-[#007AFF] font-semibold text-[15px]"
                        >
                            Go Back
                        </button>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-3 border-[#FF3B30] border-t-transparent rounded-full animate-spin mb-6" />
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Deleting your account...</h2>
                        <p className="text-[14px] text-[var(--foreground-muted)] mt-2">Please wait.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
