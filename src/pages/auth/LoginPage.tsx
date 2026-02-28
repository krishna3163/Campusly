import { SignInButton, SignUpButton } from '@insforge/react';
import {
    MessageCircle,
    BookOpen,
    Users,
    Briefcase,
    Zap,
    Shield,
    Sparkles,
    Trophy,
} from 'lucide-react';

const highlights = [
    { icon: MessageCircle, label: 'E2E Encrypted Chats', desc: 'Secure local-first messaging infrastructure.' },
    { icon: BookOpen, label: 'Study Hub', desc: 'Manage notes, assignments, and exam calendars.' },
    { icon: Briefcase, label: 'Placement Archives', desc: 'Access senior experiences and placement logs.' },
    { icon: Trophy, label: 'Campus Reputation', desc: 'Earn badges and become a campus ambassador.' },
];

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-campus-darker flex overflow-hidden">

            {/* Left Side — Branding & Features (Desktop only) */}
            <div className="hidden lg:flex flex-col flex-1 relative p-16 overflow-hidden">
                {/* Visual Orbs */}
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-20 animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-glow">
                            <span className="text-2xl font-black text-white">C</span>
                        </div>
                        <span className="text-3xl font-black text-white tracking-tight">Campusly</span>
                    </div>

                    <div className="max-w-xl flex-1 justify-center flex flex-col">
                        <h1 className="text-6xl font-black text-white leading-tight mb-8 animate-slide-up">
                            Empowering <br />
                            <span className="gradient-text">Academic Lives.</span>
                        </h1>
                        <p className="text-campus-muted text-xl mb-12 leading-relaxed max-w-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            Join the unified ecosystem built exclusively for Indian university students. Chat, study, and thrive together.
                        </p>

                        <div className="grid grid-cols-2 gap-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            {highlights.map((h, i) => (
                                <div key={h.label} className="group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500/10 group-hover:scale-110 transition-all">
                                        <h.icon size={24} />
                                    </div>
                                    <h3 className="text-white font-bold text-sm mb-1">{h.label}</h3>
                                    <p className="text-campus-muted text-xs leading-relaxed">{h.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-campus-darker bg-white/10" />)}
                            </div>
                            <p className="text-sm font-medium text-white/50">Trusted by <span className="text-white font-bold">10,000+</span> students across India.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side — Auth Portal */}
            <div className="w-full lg:w-[480px] bg-campus-dark border-l border-white/5 relative z-20 flex flex-col justify-center px-8 lg:px-16 pt-20 pb-10">
                <div className="lg:hidden absolute top-12 left-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black">C</div>
                    <span className="text-xl font-bold tracking-tight">Campusly</span>
                </div>

                <div className="max-w-full lg:max-w-sm mx-auto w-full">
                    <div className="mb-10 text-center lg:text-left transition-all">
                        <div className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            <Sparkles size={12} />
                            <span>Beta Access 2026</span>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">Welcome Back</h2>
                        <p className="text-campus-muted text-sm">Securely access your campus ecosystem.</p>
                    </div>

                    <div className="space-y-4">
                        <SignInButton>
                            <button className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-3 shadow-glow transition-all active:scale-95 group">
                                <MessageCircle size={18} className="group-hover:rotate-12 transition-transform" />
                                <span>Sign in with Identity</span>
                            </button>
                        </SignInButton>

                        <div className="relative py-6 flex items-center gap-4">
                            <div className="flex-1 h-[1px] bg-white/5" />
                            <span className="text-[10px] uppercase font-bold text-campus-muted tracking-widest">New to Campusly?</span>
                            <div className="flex-1 h-[1px] bg-white/5" />
                        </div>

                        <SignUpButton>
                            <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group">
                                <Users size={18} className="group-hover:scale-110 transition-transform" />
                                <span>Create Student Account</span>
                            </button>
                        </SignUpButton>
                    </div>

                    <div className="mt-12 space-y-4">
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
                            <Shield size={20} className="text-emerald-400 shrink-0 mt-1" />
                            <div>
                                <h4 className="text-xs font-bold text-emerald-400 mb-1">E2E Default</h4>
                                <p className="text-[10px] text-emerald-400/60 leading-relaxed">Identity verification is completed on-device. Your biometric data never leaves this terminal.</p>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-[10px] text-campus-muted/30">By signing in, you agree to our <span className="hover:text-campus-muted underline cursor-pointer">Code of Conduct</span> and <span className="hover:text-campus-muted underline cursor-pointer">Security Protocol</span>.</p>
                        </div>
                    </div>
                </div>

                <footer className="mt-auto pt-10 text-center lg:text-left">
                    <p className="text-[10px] font-black text-white/5 tracking-[0.3em] uppercase">Campusly Secure Terminal v0.8</p>
                </footer>
            </div>

            {/* Global Visual Touch */}
            <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 opacity-50 z-[100]" />
        </div>
    );
}
