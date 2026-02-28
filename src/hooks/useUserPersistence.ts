import { useEffect } from 'react';
import { useUser, useAuth } from '@insforge/react';
import { setCookie, getCookie, deleteCookie } from '../utils/cookie';

export function useUserPersistence() {
    const { user, isLoaded } = useUser();
    const { isSignedIn } = useAuth();

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && user?.id) {
            // Save minimal user info to cookies for fast UI load (names/avatars)
            // and potentially session token if the SDK uses it.
            // For now, we save the ID and display name to show "Logging in as [Name]..."
            setCookie('campusly_user_id', String(user.id));
            if (user.profile?.display_name) {
                setCookie('campusly_user_name', String(user.profile.display_name));
            }
            if (user.profile?.avatar_url) {
                setCookie('campusly_user_avatar', String(user.profile.avatar_url));
            }
        } else if (!isSignedIn) {
            // Clear if logged out
            deleteCookie('campusly_user_id');
            deleteCookie('campusly_user_name');
            deleteCookie('campusly_user_avatar');
        }
    }, [user, isSignedIn, isLoaded]);

    return {
        cachedUser: {
            id: getCookie('campusly_user_id'),
            name: getCookie('campusly_user_name'),
            avatar: getCookie('campusly_user_avatar'),
        }
    };
}
