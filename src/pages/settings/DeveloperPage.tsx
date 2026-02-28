import { DEVELOPER_INFO } from '../../types/social';
import {
    Github,
    Linkedin,
    Instagram,
    Mail,
    MapPin,
    BadgeCheck,
    MessageCircle,
    Bug,
    ExternalLink,
    ArrowLeft,
    Code2,
    Heart,
    Sparkles,
    Globe,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeveloperPage() {
    const navigate = useNavigate();
    const dev = DEVELOPER_INFO;

    const socialLinks = [
        { icon: Linkedin, label: 'LinkedIn', url: dev.links.linkedin, color: 'from-blue-600 to-blue-500', hoverBg: 'hover:bg-blue-500/10 hover:border-blue-500/40' },
        { icon: Github, label: 'GitHub', url: dev.links.github, color: 'from-gray-600 to-gray-500', hoverBg: 'hover:bg-white/10 hover:border-white/30' },
        { icon: Instagram, label: 'Instagram', url: dev.links.instagram, color: 'from-pink-600 to-purple-500', hoverBg: 'hover:bg-pink-500/10 hover:border-pink-500/40' },
        { icon: Mail, label: 'Email', url: dev.links.email, color: 'from-emerald-600 to-emerald-500', hoverBg: 'hover:bg-emerald-500/10 hover:border-emerald-500/40' },
    ];

    return (
        <div className="h-full bg-campus-darker overflow-y-auto">
            {/* Hero Banner */}
            <div className="relative h-56 lg:h-72 bg-gradient-to-br from-brand-600/30 via-purple-600/20 to-emerald-600/10 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-campus-darker to-transparent" />

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-20 p-3 bg-black/30 backdrop-blur-md rounded-2xl text-white hover:bg-black/50 transition-all active:scale-90"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-6 -mt-24 relative z-10 pb-16 animate-fade-in">
                {/* Profile Card */}
                <div className="glass-card p-10 text-center mb-8">
                    <div className="relative inline-block mb-6">
                        <div className="w-32 h-32 rounded-[40px] bg-gradient-to-tr from-brand-500 via-purple-500 to-emerald-500 p-1 shadow-glow-lg mx-auto">
                            <div className="w-full h-full rounded-[38px] bg-campus-dark flex items-center justify-center border-4 border-campus-dark overflow-hidden">
                                <span className="text-5xl font-black bg-gradient-to-tr from-brand-400 to-emerald-400 bg-clip-text text-transparent">K</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center shadow-glow border-4 border-campus-dark">
                            <BadgeCheck size={18} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-white mb-2">{dev.name}</h1>
                    <p className="text-base text-brand-400 font-bold mb-4">{dev.title}</p>

                    <div className="flex items-center justify-center gap-2 text-campus-muted mb-8">
                        <MapPin size={14} />
                        <span className="text-sm">{dev.location}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                            href={dev.links.email}
                            className="btn-primary px-8 py-3 rounded-2xl font-bold shadow-glow flex items-center gap-2 active:scale-95 transition-all"
                        >
                            <MessageCircle size={18} />
                            Message Developer
                        </a>
                        <button
                            onClick={() => navigate('/app/settings/bug-report')}
                            className="glass-card px-8 py-3 hover:bg-white/5 active:scale-95 transition-all flex items-center gap-2 text-white font-bold"
                        >
                            <Bug size={18} className="text-red-400" />
                            Report Bug
                        </button>
                        <button
                            onClick={() => navigate('/app/settings/bug-report?type=suggestion')}
                            className="glass-card px-8 py-3 hover:bg-white/5 active:scale-95 transition-all flex items-center gap-2 text-white font-bold border border-brand-500/30"
                        >
                            <Sparkles size={18} className="text-brand-400" />
                            Suggest Feature
                        </button>
                    </div>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {socialLinks.map(link => (
                        <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`glass-card p-5 flex items-center gap-5 group transition-all ${link.hoverBg}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg`}>
                                <link.icon size={22} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-white">{link.label}</p>
                                <p className="text-xs text-campus-muted truncate">{link.url.replace('https://', '').replace('mailto:', '')}</p>
                            </div>
                            <ExternalLink size={16} className="text-campus-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    ))}
                </div>

                {/* About */}
                <div className="glass-card p-8 border-brand-500/10 bg-brand-500/[0.02]">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles size={20} className="text-brand-400" />
                        <h3 className="text-lg font-black text-white">About This App</h3>
                    </div>
                    <p className="text-sm text-campus-muted leading-relaxed mb-6">
                        Campusly is a unified operating system for Indian campus life. Built with a local-first architecture, E2E encryption, and real-time mesh capabilities. Designed to thrive in high-density hostel environments where connectivity is unreliable.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { icon: Code2, label: 'React + TypeScript', color: 'text-blue-400' },
                            { icon: Globe, label: 'InsForge Backend', color: 'text-emerald-400' },
                            { icon: Heart, label: 'Open Source', color: 'text-pink-400' },
                            { icon: BadgeCheck, label: 'E2E Encrypted', color: 'text-brand-400' },
                        ].map(item => (
                            <div key={item.label} className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <item.icon size={24} className={`mx-auto mb-2 ${item.color}`} />
                                <p className="text-[10px] font-bold text-campus-muted uppercase tracking-wider">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
