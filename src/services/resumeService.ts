/**
 * resumeService — AI-powered (mocked) resume parsing and analysis
 */

import { insforge } from '../lib/insforge';

export interface ResumeExtractedData {
    skills: string[];
    experience: {
        company: string;
        role: string;
        duration: string;
        highlights: string[];
    }[];
    education: {
        institute: string;
        degree: string;
        year: string;
        cgpa?: string;
    }[];
    projects: {
        title: string;
        description: string;
        link?: string;
    }[];
}

export const resumeService = {
    /**
     * Parse a resume PDF and extract key structured information
     */
    extractDetails: async (file: File): Promise<ResumeExtractedData> => {
        // In a real scenario, this would use an OCR or PDF parsing library or an AI endpoint
        // For Campusly demonstrate, we simulate a delay and return structured mock data
        console.log(`Analyzing resume: ${file.name}...`);

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    skills: ['React.js', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Machine Learning'],
                    experience: [
                        {
                            company: 'Google Summer of Code',
                            role: 'Open Source Contributor',
                            duration: 'Summer 2025',
                            highlights: ['Optimized core algorithms', 'Improved performance by 40%']
                        }
                    ],
                    education: [
                        {
                            institute: 'Indian Institute of Technology (IIT)',
                            degree: 'B.Tech in Computer Science',
                            year: '2022 - 2026',
                            cgpa: '9.2'
                        }
                    ],
                    projects: [
                        {
                            title: 'Campusly App',
                            description: 'Unified campus ecosystem for 20k+ students.',
                            link: 'https://campusly.app'
                        }
                    ]
                });
            }, 2500);
        });
    },

    /**
     * Update user profile based on resume data
     */
    updateProfileFromResume: async (userId: string, data: ResumeExtractedData) => {
        const { error } = await insforge.database.from('profiles').update({
            skills: data.skills,
            bio: `Passionate ${data.education[0]?.degree} student @ ${data.education[0]?.institute}. Exp: ${data.experience[0]?.role} @ ${data.experience[0]?.company}`,
            study_goals: `Mastering ${data.skills.slice(0, 3).join(', ')}`
        }).eq('id', userId);

        return !error;
    }
};
