import { useState, useEffect } from 'react';
import { UserService } from '../../services/userService';

interface MentionSuggestionsProps {
    query: string;
    campusId?: string;
    onSelect: (user: { id: string; display_name: string }) => void;
    visible: boolean;
}

export default function MentionSuggestions({ query, campusId, onSelect, visible }: MentionSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible || !query.trim()) {
            setSuggestions([]);
            return;
        }

        const timeout = setTimeout(async () => {
            setLoading(true);
            const { data } = await UserService.searchProfiles(query, campusId, 5);
            setSuggestions(data || []);
            setLoading(false);
        }, 200);

        return () => clearTimeout(timeout);
    }, [query, visible, campusId]);

    if (!visible || (!loading && suggestions.length === 0)) return null;

    return (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden z-50 max-h-[200px] overflow-y-auto">
            {loading ? (
                <div className="px-4 py-3 text-[13px] text-[var(--foreground-muted)]">Searching...</div>
            ) : (
                suggestions.map(u => (
                    <button
                        key={u.id}
                        onClick={() => onSelect(u)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--background)] transition-colors text-left"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#007AFF] overflow-hidden shrink-0">
                            {u.avatar_url ? (
                                <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                    {u.display_name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[var(--foreground)] truncate">{u.display_name}</p>
                            <p className="text-[11px] text-[var(--foreground-muted)]">{u.branch} • Sem {u.semester}</p>
                        </div>
                    </button>
                ))
            )}
        </div>
    );
}
