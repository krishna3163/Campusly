import { insforge } from '../lib/insforge';

export const ValidationService = {
    validateDisplayName(name: string) {
        if (!name || name.trim().length < 3) return { valid: false, error: 'Name must be at least 3 characters' };
        if (name.length > 50) return { valid: false, error: 'Name too long' };
        return { valid: true };
    },

    validateBio(bio: string) {
        if (bio.length > 160) return { valid: false, error: 'Bio must be under 160 characters' };
        return { valid: true };
    },

    validateGroupDescription(desc: string) {
        if (desc.length > 1000) return { valid: false, error: 'Description too long' };
        return { valid: true };
    },

    async checkUsernameAvailability(username: string, userId?: string) {
        const { data } = await insforge.database
            .from('profiles')
            .select('id')
            .eq('username', username.toLowerCase())
            .maybeSingle();

        if (data && data.id !== userId) return false;
        return true;
    }
};
