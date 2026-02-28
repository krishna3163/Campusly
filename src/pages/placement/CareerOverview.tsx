import { TrendingUp, Award, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function CareerOverview() {
    const stats = [
        { label: 'Highest Package', value: '45.5 LPA', sub: 'Technical SDE-1', icon: Award, color: 'text-amber-400' },
        { label: 'Total Placed', value: '420+', sub: 'Recruitment 2026', icon: Users, color: 'text-brand-400' },
        { label: 'Avg Package', value: '8.2 LPA', sub: 'Across Branches', icon: TrendingUp, color: 'text-purple-400' },
    ];

    return (
        <div className="h-full bg-campus-darker overflow-y-auto px-6 py-10">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 animate-fade-in">
                    <h1 className="text-3xl font-black text-white">Career Insights</h1>
                    <p className="text-campus-muted text-sm mt-1">Real-time statistics from our campus placement cell.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {stats.map((s, i) => (
                        <div key={i} className="glass-card p-8 flex flex-col justify-between h-48 group hover:border-brand-500/30 transition-all">
                            <s.icon size={24} className={s.color} />
                            <div>
                                <h4 className="text-[10px] font-bold text-campus-muted uppercase tracking-widest">{s.label}</h4>
                                <p className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{s.value}</p>
                                <p className="text-[10px] text-campus-muted font-bold mt-1">{s.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section className="glass-card p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-lg">Hiring Companies</h3>
                            <button className="text-xs text-brand-400 font-bold flex items-center gap-1">View Schedule <ArrowUpRight size={14} /></button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: 'Google', role: 'SWE Intern', date: 'March 15', status: 'Upcoming' },
                                { name: 'Amazon', role: 'SDE-1 Fulltime', date: 'March 20', status: 'Registration' },
                                { name: 'Microsoft', role: 'Support Eng', date: 'March 22', status: 'Upcoming' },
                            ].map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-brand-400">{c.name[0]}</div>
                                        <div>
                                            <h4 className="font-bold text-sm text-white">{c.name}</h4>
                                            <p className="text-[10px] text-campus-muted font-bold uppercase">{c.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-white">{c.date}</p>
                                        <p className="text-[10px] text-brand-400 font-bold uppercase">{c.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="glass-card p-8 bg-gradient-to-br from-brand-600/10 to-transparent flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-lg mb-2">Live Trends</h3>
                            <p className="text-sm text-campus-muted">Skills currently in high demand on campus.</p>
                            <div className="flex flex-wrap gap-2 mt-8">
                                {['System Design', 'React Native', 'AWS Architecture', 'Python for Finance', 'Solidity', 'Rust'].map(s => (
                                    <span key={s} className="px-5 py-2 bg-white/5 rounded-full text-xs font-bold text-campus-muted border border-white/5">{s}</span>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-brand-400">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Verified by Placement Cell</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
