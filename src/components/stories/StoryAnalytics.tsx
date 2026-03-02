import React from 'react';
import {
    Eye,
    Heart,
    Camera,
    MessageCircle,
    Send,
    TrendingUp,
    Clock,
    X,
} from 'lucide-react';
import { StatusStory } from '../../types';

interface StoryAnalyticsProps {
    story: StatusStory;
    onClose: () => void;
}

export const StoryAnalytics: React.FC<StoryAnalyticsProps> = ({ story, onClose }) => {
    // Simulated peak view time graph data
    const peakData = [20, 45, 80, 50, 60, 95, 40, 30, 15];

    return (
        <div className="flex flex-col h-[85vh] bg-campus-dark/95 backdrop-blur-3xl rounded-t-[40px] border-t border-white/10 p-8 text-white overflow-hidden shadow-2xl">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" onClick={onClose}></div>

            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <TrendingUp className="text-brand-400" /> Story Insights
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-campus-muted">Total Views</span>
                        <Eye size={16} className="text-brand-400" />
                    </div>
                    <span className="text-4xl font-black">{story.view_count || 0}</span>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-campus-muted">Unique</span>
                        <TrendingUp size={16} className="text-indigo-400" />
                    </div>
                    <span className="text-4xl font-black">{Math.floor(story.view_count * 0.85) || 0}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center">
                    <Heart size={18} className="text-red-500 mb-2" />
                    <span className="text-lg font-black">{story.reaction_count || 0}</span>
                    <span className="text-[8px] font-bold text-campus-muted uppercase">Likes</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center">
                    <Camera size={18} className="text-yellow-500 mb-2" />
                    <span className="text-lg font-black">{story.screenshot_count || 0}</span>
                    <span className="text-[8px] font-bold text-campus-muted uppercase">Screenshots</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center">
                    <MessageCircle size={18} className="text-blue-500 mb-2" />
                    <span className="text-lg font-black">{story.reply_count || 0}</span>
                    <span className="text-[8px] font-bold text-campus-muted uppercase">Replies</span>
                </div>
            </div>

            <section className="mb-8">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-campus-muted mb-6 px-2 flex items-center justify-between">
                    <span>Performance Trend</span>
                    <span className="flex items-center gap-2"><Clock size={12} /> Last 24h</span>
                </h4>
                <div className="h-32 flex items-end gap-2 px-2">
                    {peakData.map((val, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg transition-all duration-1000 origin-bottom"
                            style={{ height: `${val}%` }}
                        ></div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 px-2 text-[8px] font-bold uppercase tracking-widest text-campus-muted">
                    <span>0h</span>
                    <span>12h</span>
                    <span>24h</span>
                </div>
            </section>

            <section className="flex-1 overflow-y-auto">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-campus-muted mb-4 px-2">Viewers List</h4>
                <div className="space-y-4">
                    {(story.views || []).length > 0 ? (
                        story.views?.map((v, idx) => (
                            <div key={idx} className="flex items-center gap-4 px-2 py-2 group">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-brand-500/50 transition-all">
                                    {v.user?.avatar_url ? (
                                        <img src={v.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center font-bold text-xs">
                                            {v.user?.display_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">{v.user?.display_name}</p>
                                    <p className="text-[10px] text-campus-muted font-bold uppercase tracking-wider">{new Date(v.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <button className="p-2 text-white/20 hover:text-white transition-all"><Send size={16} /></button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 opacity-30 italic text-sm">No views yet. Share it around!</div>
                    )}
                </div>
            </section>
        </div>
    );
};
