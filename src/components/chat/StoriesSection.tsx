import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusTab } from '../stories/StatusTab';
import type { UserProfile } from '../../types';

interface StoriesSectionProps {
    isCollapsed: boolean;
    currentUser: UserProfile;
    myStories: any[];
    allStatuses: Record<string, any[]>;
    onStatusClick: (uid: string) => void;
    onAddStatus: () => void;
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({
    isCollapsed,
    currentUser,
    myStories,
    allStatuses,
    onStatusClick,
    onAddStatus
}) => {
    return (
        <motion.div
            initial={false}
            animate={{
                height: isCollapsed ? 0 : 'auto',
                opacity: isCollapsed ? 0 : 1,
                marginBottom: isCollapsed ? 0 : '1.5rem',
                scaleY: isCollapsed ? 0.9 : 1,
                y: isCollapsed ? -20 : 0
            }}
            transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1] // Apple-style smooth cubic-bezier
            }}
            className="overflow-hidden relative z-10 origin-top select-none"
        >
            <div className={`px-2 py-1 transform-gpu`}>
                <StatusTab
                    currentUser={currentUser}
                    myStories={myStories}
                    allStatuses={allStatuses}
                    onStatusClick={onStatusClick}
                    onAddStatus={onAddStatus}
                />
            </div>

            {/* Subtle bottom separator when expanded */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mt-4"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
