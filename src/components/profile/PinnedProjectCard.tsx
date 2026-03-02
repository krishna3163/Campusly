import { Star, GitFork, Calendar, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export interface PinnedProject {
    name: string;
    description: string;
    stars: number;
    forks: number;
    languages: string[];
    updated_at: string;
    url: string;
}

export default function PinnedProjectCard({ project, index }: { project: PinnedProject; index: number }) {
    if (!project) return null;

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 border-white/5 hover:border-brand-500/20 hover:bg-white/[0.04] transition-all group flex flex-col h-full"
        >
            <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20 group-hover:scale-110 transition-transform">
                        <GitFork size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{project.name}</h4>
                        <p className="text-[10px] text-campus-muted font-bold uppercase tracking-wider">GitHub Project</p>
                    </div>
                </div>
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 text-campus-muted hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    <ExternalLink size={14} />
                </a>
            </div>

            <p className="text-xs text-campus-muted mb-6 line-clamp-2 leading-relaxed h-[36px]">
                {project.description || 'No description provided.'}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
                {project.languages?.slice(0, 3).map(lang => (
                    <span key={lang} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-campus-muted uppercase">
                        {lang}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <Star size={14} className="text-yellow-400" /> {project.stars}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <GitFork size={14} className="text-brand-400" /> {project.forks}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-campus-muted uppercase tracking-tighter">
                    <Calendar size={12} /> {new Date(project.updated_at).toLocaleDateString()}
                </div>
            </div>
        </motion.div>
    );
}
