import { useState, useEffect, useRef } from 'react';
import { useUser } from '@insforge/react';
import { useNavigate } from 'react-router-dom';
import { insforge } from '../../lib/insforge';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import type { UserProfile } from '../../types';
import { Plus, Eye, X, Image, Video, Music, FileText, Lightbulb, Users, UserCheck } from 'lucide-react';

type StatusType = 'thought' | 'note' | 'photo' | 'video' | 'audio';

export default function StatusPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [myStatus, setMyStatus] = useState<string | null>(null);
    const [statusUpdates, setStatusUpdates] = useState<{ profile: UserProfile; status?: string; time?: string }[]>([]);
    const [showAddStatus, setShowAddStatus] = useState(false);
    const { uploadFile } = useMediaUpload();

    useEffect(() => {
        if (user?.id) loadStatus();
    }, [user?.id]);

    const loadStatus = async () => {
        if (!user?.id) return;
        try {
            const { data: profile } = await insforge.database.from('profiles').select('*').eq('id', user.id).single();
            const activity = (profile as any)?.activity_status;
            setMyStatus(activity || null);

            const { data: members } = await insforge.database.from('conversation_members').select('conversation_id').eq('user_id', user.id);
            if (!members?.length) return;
            const { data: convs } = await insforge.database.from('conversations').select('id').in('id', members.map(m => m.conversation_id)).eq('type', 'direct');
            if (!convs?.length) return;
            const otherIds = new Set<string>();
            for (const c of convs) {
                const { data: m } = await insforge.database.from('conversation_members').select('user_id').eq('conversation_id', c.id).neq('user_id', user.id).limit(1);
                if (m?.[0]) otherIds.add(m[0].user_id);
            }
            if (otherIds.size === 0) return;
            const { data: profiles } = await insforge.database.from('profiles').select('*').in('id', Array.from(otherIds));
            setStatusUpdates((profiles || []).map(p => ({
                profile: p as UserProfile,
                status: (p as any).activity_status || undefined,
                time: 'Recent',
            })));
        } catch (_) {}
    };

    const handleAddStatus = () => setShowAddStatus(true);

    const saveStatus = (text: string, type: StatusType = 'thought', mediaUrl?: string, _visibility?: 'followers' | 'individual', _visibleTo?: string[]) => {
        if (!user?.id) return;
        const content = text.trim() || mediaUrl || '';
        if (!content) return;
        insforge.database.from('profiles').update({
            activity_status: type === 'note' ? `📝 ${text.slice(0, 50)}` : type === 'thought' ? text : type === 'photo' ? '📷 Photo' : type === 'video' ? '🎬 Video' : type === 'audio' ? '🎵 Audio' : text,
            updated_at: new Date().toISOString(),
        }).eq('id', user.id).then(() => {
            setMyStatus(content);
            setShowAddStatus(false);
            loadStatus();
        });
    };

    return (
        <div className="h-full bg-campus-darker overflow-y-auto">
            <div className="max-w-2xl mx-auto p-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-black text-white">Status</h1>
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 text-campus-muted hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-campus-card rounded-2xl p-6 border border-campus-border shadow-card">
                        <h3 className="text-sm font-bold text-campus-muted uppercase tracking-wider mb-4">My Status</h3>
                        <button
                            onClick={handleAddStatus}
                            className="w-full flex items-center gap-4 p-4 rounded-xl bg-campus-darker/50 border border-dashed border-campus-border hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
                        >
                            <div className="w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                                <Plus size={24} className="text-brand-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-white">Add to my status</p>
                                <p className="text-xs text-campus-muted">Share an update with your contacts</p>
                            </div>
                        </button>
                        {myStatus && (
                            <div className="mt-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
                                <p className="text-brand-300 font-medium">{myStatus}</p>
                                <button onClick={() => saveStatus('')} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-campus-card rounded-2xl p-6 border border-campus-border shadow-card">
                        <h3 className="text-sm font-bold text-campus-muted uppercase tracking-wider mb-4">Recent Updates</h3>
                        {statusUpdates.length === 0 ? (
                            <p className="text-campus-muted text-sm py-6 text-center">No status updates from contacts yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {statusUpdates.map(({ profile }) => (
                                    <div
                                        key={profile.id}
                                        onClick={() => navigate('/app/chats')}
                                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center overflow-hidden shrink-0">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <span className="text-white font-bold">{profile.display_name?.charAt(0) || '?'}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{profile.display_name}</p>
                                            <p className="text-xs text-campus-muted truncate">{profile.activity_status || 'No status'}</p>
                                        </div>
                                        <Eye size={18} className="text-campus-muted shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {showAddStatus && (
                    <AddStatusModal
                        onClose={() => setShowAddStatus(false)}
                        onSave={saveStatus}
                        currentStatus={myStatus || ''}
                        uploadFile={uploadFile}
                    />
                )}
            </div>
        </div>
    );
}

function AddStatusModal({ onClose, onSave, currentStatus, uploadFile }: { onClose: () => void; onSave: (t: string, type: StatusType, mediaUrl?: string, visibility?: 'followers' | 'individual', visibleTo?: string[]) => void; currentStatus: string; uploadFile: (f: File, bucket?: string) => Promise<string | null> }) {
    const [text, setText] = useState(currentStatus);
    const [type, setType] = useState<StatusType>('thought');
    const [visibility, setVisibility] = useState<'followers' | 'individual'>('followers');
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setMediaFile(f);
        const url = URL.createObjectURL(f);
        setMediaPreview(url);
    };

    const handleSave = async () => {
        let url: string | undefined;
        if (mediaFile && (type === 'photo' || type === 'video' || type === 'audio')) {
            url = (await uploadFile(mediaFile, 'status-media')) || undefined;
        }
        onSave(text || (url ? 'Media' : ''), type, url, visibility, []);
    };

    const types: { id: StatusType; label: string; icon: typeof Lightbulb }[] = [
        { id: 'thought', label: 'Thought', icon: Lightbulb },
        { id: 'note', label: 'Note', icon: FileText },
        { id: 'photo', label: 'Photo', icon: Image },
        { id: 'video', label: 'Video', icon: Video },
        { id: 'audio', label: 'Audio', icon: Music },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card p-6 w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Add Status</h2>
                    <button onClick={onClose} className="text-campus-muted hover:text-white"><X size={20} /></button>
                </div>

                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {types.map(t => (
                        <button key={t.id} onClick={() => { setType(t.id); setMediaFile(null); setMediaPreview(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${type === t.id ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-white/5 text-campus-muted hover:text-white border border-transparent'}`}>
                            <t.icon size={18} />
                            {t.label}
                        </button>
                    ))}
                </div>

                <input type="file" ref={fileRef} className="hidden" accept={type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : '*'} onChange={handleFile} />

                {(type === 'photo' || type === 'video' || type === 'audio') && (
                    <div className="mb-4">
                        <button onClick={() => fileRef.current?.click()} className="w-full py-6 rounded-xl border-2 border-dashed border-campus-border hover:border-brand-500/50 bg-white/5 hover:bg-brand-500/5 transition-all text-campus-muted hover:text-brand-400 flex flex-col items-center gap-2">
                            {mediaPreview ? (type === 'photo' ? <img src={mediaPreview} className="max-h-40 rounded-lg object-cover" alt="" /> : type === 'video' ? <video src={mediaPreview} className="max-h-40 rounded-lg" controls /> : <audio src={mediaPreview} controls />) : <><Image size={32} /> Choose {type}</>}
                        </button>
                    </div>
                )}

                <textarea value={text} onChange={e => setText(e.target.value)} placeholder={type === 'thought' ? "What's on your mind?" : type === 'note' ? "Add a note..." : `Add caption for ${type}...`} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-campus-muted outline-none focus:border-brand-500 min-h-[80px] resize-none mb-4" rows={2} />

                <div className="mb-4">
                    <p className="text-[10px] font-bold text-campus-muted uppercase tracking-wider mb-2">Who can see</p>
                    <div className="flex gap-2">
                        <button onClick={() => setVisibility('followers')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold ${visibility === 'followers' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-white/5 text-campus-muted border border-transparent'}`}><Users size={16} /> Followers</button>
                        <button onClick={() => setVisibility('individual')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold ${visibility === 'individual' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40' : 'bg-white/5 text-campus-muted border border-transparent'}`}><UserCheck size={16} /> Select</button>
                    </div>
                    {visibility === 'individual' && <p className="text-xs text-campus-muted mt-2">You can choose specific contacts when sharing.</p>}
                </div>

                <div className="flex gap-3">
                    <button onClick={handleSave} className="flex-1 btn-primary py-3 rounded-xl font-bold">Post Status</button>
                    <button onClick={onClose} className="px-6 py-3 rounded-xl bg-white/5 text-campus-muted hover:text-white">Cancel</button>
                </div>
            </div>
        </div>
    );
}
