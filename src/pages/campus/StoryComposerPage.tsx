import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@insforge/react';
import { StoryCamera } from '../../components/stories/StoryCamera';
import { StoryEditor } from '../../components/stories/StoryEditor';
import { StatusService } from '../../services/statusService';
import { useAppStore } from '../../stores/appStore';
import { UserProfile } from '../../types';

const StoryComposerPage: React.FC = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const { showToast } = useAppStore();

    const [capturedMedia, setCapturedMedia] = useState<{ file: File; type: 'image' | 'video' } | null>(null);

    const handleCapture = (file: File, type: 'image' | 'video') => {
        setCapturedMedia({ file, type });
    };

    const handlePost = async (storyData: any) => {
        if (!user) return;

        try {
            const campusId = (user.profile as any)?.campus_id || '00000000-0000-0000-0000-000000000000';

            if (capturedMedia) {
                // Upload media and create story
                await StatusService.uploadStatus(
                    user.id,
                    campusId,
                    capturedMedia.file,
                    storyData.content,
                    storyData.metadata
                );
            } else if (storyData.type === 'text') {
                await StatusService.postText(
                    user.id,
                    campusId,
                    storyData.content,
                    storyData.metadata?.bg_color
                );
            }

            showToast('Story shared!', 'success');
            navigate('/app/campus');
        } catch (err) {
            console.error(err);
            showToast('Failed to share story', 'error');
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {!capturedMedia ? (
                <StoryCamera
                    onCapture={handleCapture}
                    onClose={() => navigate(-1)}
                />
            ) : (
                <StoryEditor
                    file={capturedMedia.file}
                    mediaType={capturedMedia.type}
                    currentUser={{ id: user.id, ...user.profile } as UserProfile}
                    onClose={() => setCapturedMedia(null)}
                    onPost={handlePost}
                />
            )}
        </div>
    );
};

export default StoryComposerPage;
