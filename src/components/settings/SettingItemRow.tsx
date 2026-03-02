import { useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { type SettingItem, useSettingsStore } from '../../stores/settingsStore';
import { useAppStore } from '../../stores/appStore';
import { db } from '../../lib/db';
import { ChevronRight } from 'lucide-react';

interface SettingItemProps {
    categoryId: string;
    item: SettingItem;
    isLast?: boolean;
}

export function SettingItemRow({ categoryId, item, isLast }: SettingItemProps) {
    const { updateSetting } = useSettingsStore();
    const navigate = useNavigate();
    const { user } = useUser();
    const setTheme = useAppStore(state => state.setTheme);

    const handleChange = async (value: any) => {
        if (item.type === 'action') {
            if (item.id === 'report_bug') {
                navigate('/app/settings/bug-report');
                return;
            }
            if (item.id === 'clear_cache') {
                try {
                    // Clear Dexie DB tables
                    await Promise.all([
                        db.messages.clear(),
                        db.conversations.clear(),
                        db.conversationMembers.clear(),
                        db.statuses.clear()
                    ]);
                    localStorage.removeItem('campusly_cache_metadata');
                    alert('Offline cache dissolved. Re-syncing with mesh...');
                    window.location.reload();
                } catch (err) {
                    console.error('Failed to clear cache:', err);
                }
                return;
            }
            if (item.id === 'delete_account' || item.id === 'wipe_all') {
                if (window.confirm('CRITICAL ACTION: This will permanently wipe all local data and dissolve your session identity. Proceed?')) {
                    try {
                        await db.delete();
                        localStorage.clear();
                        window.location.href = '/login';
                    } catch (err) {
                        localStorage.clear();
                        window.location.href = '/login';
                    }
                }
                return;
            }
            alert(`Signal transmitted for: ${item.title}`);
            return;
        }

        if (categoryId === 'appearance' && item.id === 'theme') {
            const themeVal = value.toLowerCase();
            if (themeVal === 'light' || themeVal === 'dark') {
                setTheme(themeVal);
            }
        }

        await updateSetting(categoryId, item.id, value);
    };

    return (
        <div className={`flex items-center justify-between p-4 bg-transparent hover:bg-[var(--foreground)]/[0.04] active:bg-[var(--foreground)]/[0.07] transition-all group relative ${!isLast ? 'border-b border-[var(--border)]' : ''}`}>
            <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-[17px] font-medium text-[var(--foreground)] leading-tight">{item.title}</h3>
                <p className="text-[13px] text-[var(--foreground-muted)] mt-1 line-clamp-1">{item.description}</p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-3">
                {item.type === 'toggle' && (
                    <button
                        onClick={() => handleChange(!item.value)}
                        className={`w-[51px] h-[31px] rounded-full transition-all duration-300 relative ${item.value ? 'bg-[#34C759]' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-lg transition-all duration-300 transform ${item.value ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                )}

                {item.type === 'dropdown' && (
                    <div className="flex items-center gap-1">
                        <span className="text-[15px] text-gray-500 font-medium">{item.value}</span>
                        <select
                            value={item.value}
                            onChange={(e) => handleChange(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        >
                            {item.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <ChevronRight size={18} className="text-gray-600/50" />
                    </div>
                )}

                {item.type === 'slider' && (
                    <div className="flex items-center gap-3">
                        <span className="text-[13px] font-bold text-brand-400 min-w-[20px] text-center">{item.value}</span>
                        <input
                            type="range"
                            min={item.min}
                            max={item.max}
                            value={item.value}
                            onChange={(e) => handleChange(Number(e.target.value))}
                            className="accent-brand-500 h-1.5 w-24 rounded-lg cursor-pointer bg-white/10 appearance-none"
                        />
                    </div>
                )}

                {item.type === 'input' && (
                    <div className="flex items-center gap-1">
                        <span className="text-[15px] text-gray-500 truncate max-w-[100px]">{item.value || 'Set...'}</span>
                        <ChevronRight size={18} className="text-gray-600/50" />
                        {/* Simple modal or inline edit could be here, keeping it simple for mobile view */}
                    </div>
                )}

                {item.type === 'action' && (
                    <button
                        onClick={() => handleChange('trigger')}
                        className={`text-[17px] font-medium transition-all ${item.id.includes('delete') || item.id.includes('wipe') ? 'text-red-500 hover:text-red-400' : 'text-brand-500 hover:text-brand-400'}`}
                    >
                        {item.actionText}
                    </button>
                )}
            </div>
        </div>
    );
}
