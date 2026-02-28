import { useState, useRef } from 'react';
import { useUser } from '@insforge/react';
import { useNavigate } from 'react-router-dom';
import { submitBugReport } from '../../services/bugReportService';
import {
    ArrowLeft,
    Bug,
    Send,
    Camera,
    X,
    CheckCircle2,
    Loader2,
    AlertTriangle,
} from 'lucide-react';

export default function BugReportPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setScreenshot(file);
            setScreenshotPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!user?.id || !title.trim()) return;
        setSubmitting(true);

        const result = await submitBugReport(user.id, {
            title,
            description,
            steps,
            screenshotFile: screenshot || undefined,
        });

        setSubmitting(false);
        if (result) {
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <div className="h-full bg-campus-darker flex items-center justify-center p-6 animate-fade-in">
                <div className="glass-card p-12 max-w-md w-full text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
                        <CheckCircle2 size={40} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Report Submitted!</h2>
                    <p className="text-sm text-campus-muted mb-8 leading-relaxed">
                        Thank you for helping us improve Campusly. Our team has been notified and will review your report shortly. You can track the status in your settings.
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-primary w-full py-4 rounded-2xl font-bold shadow-glow"
                    >
                        Back to Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-campus-darker overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-10 animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all active:scale-90 text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <Bug className="text-red-400" size={24} />
                            Report a Bug
                        </h1>
                        <p className="text-sm text-campus-muted mt-1">Help us squash bugs and improve your experience</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-campus-muted tracking-widest pl-1">
                            Bug Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Chat messages not syncing"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-brand-500 text-white placeholder:text-white/20"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-campus-muted tracking-widest pl-1">
                            What happened?
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the bug in detail..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-brand-500 text-white placeholder:text-white/20 h-32 resize-none"
                        />
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-campus-muted tracking-widest pl-1">
                            Steps to Reproduce
                        </label>
                        <textarea
                            value={steps}
                            onChange={e => setSteps(e.target.value)}
                            placeholder="1. Open the chat page&#10;2. Tap on a conversation&#10;3. Send a message&#10;4. The error appears..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-brand-500 text-white placeholder:text-white/20 h-32 resize-none"
                        />
                    </div>

                    {/* Screenshot */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-campus-muted tracking-widest pl-1">
                            Screenshot (optional)
                        </label>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />

                        {screenshotPreview ? (
                            <div className="relative inline-block">
                                <img src={screenshotPreview} alt="Bug preview" className="max-h-48 rounded-2xl border border-white/10" />
                                <button
                                    onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white shadow-lg"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="glass-card w-full py-8 flex flex-col items-center gap-3 hover:bg-white/5 transition-all group"
                            >
                                <Camera size={28} className="text-campus-muted group-hover:text-white transition-colors" />
                                <span className="text-sm text-campus-muted group-hover:text-white">Tap to attach screenshot</span>
                            </button>
                        )}
                    </div>

                    {/* Auto-captured info */}
                    <div className="glass-card p-5 border-amber-500/10 bg-amber-500/[0.03]">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={14} className="text-amber-400" />
                            <span className="text-xs font-bold text-amber-400">Auto-Captured</span>
                        </div>
                        <p className="text-[11px] text-campus-muted leading-relaxed">
                            Device info, browser version, screen resolution, and app version will be automatically attached to help our team reproduce and fix the issue faster.
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || submitting}
                        className="btn-primary w-full py-4 rounded-2xl font-black shadow-glow flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                        {submitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                        {submitting ? 'Submitting...' : 'Submit Bug Report'}
                    </button>
                </div>
            </div>
        </div>
    );
}
