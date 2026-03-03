import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Globe,
    Check
} from 'lucide-react';

const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

export default function LanguageSettingsPage() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(localStorage.getItem('campusly_lang') || 'en');

    const handleSelect = (code: string) => {
        setSelected(code);
        localStorage.setItem('campusly_lang', code);
    };

    return (
        <div className="h-full bg-[var(--background)] flex flex-col overflow-hidden">
            <div className="bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 shrink-0">
                <button onClick={() => navigate(-1)} className="text-[#007AFF] flex items-center gap-1">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[17px] font-bold text-[var(--foreground)]">Language</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-4">
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <Globe size={18} className="text-[var(--foreground-muted)]" />
                        <p className="text-[13px] text-[var(--foreground-muted)]">Select your preferred language for the app interface.</p>
                    </div>

                    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[var(--background)] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-[16px] font-semibold text-[var(--foreground)]">{lang.name}</span>
                                    <span className="text-[14px] text-[var(--foreground-muted)]">{lang.native}</span>
                                </div>
                                {selected === lang.code && (
                                    <Check size={20} className="text-[#007AFF]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
