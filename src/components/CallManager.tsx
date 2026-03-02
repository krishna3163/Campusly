import React, { useEffect, useState } from 'react';
import { useUser } from '@insforge/react';
import { callService } from '../services/callService';
import IncomingCallModal from './call/IncomingCallModal';
import CallModal from './call/CallModal';
import { insforge } from '../lib/insforge';
import type { UserProfile } from '../types';

export default function CallManager() {
    const { user } = useUser();
    const [incomingCall, setIncomingCall] = useState<{ id: string, from: string, type: 'audio' | 'video' } | null>(null);
    const [activeCall, setActiveCall] = useState<{ id: string, isCaller: boolean, type: 'audio' | 'video', targetId: string } | null>(null);
    const [targetUserProfile, setTargetUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        // Subscribe to global call requests
        const cleanup = callService.subscribeSignals(user.id, async (event, from, data) => {
            if (event === 'call-request') {
                setIncomingCall({ id: data.callId, from, type: data.type });
            }
        });

        // Add a specialized listener for external call triggers (e.g., from ChatPage)
        const eventBus = (e: any) => {
            if (e.detail?.action === 'start-call') {
                handleStartCall(e.detail.targetId, e.detail.type);
            }
        };
        window.addEventListener('campusly-call-action', eventBus);

        return () => {
            cleanup();
            window.removeEventListener('campusly-call-action', eventBus);
        };
    }, [user?.id]);

    const handleStartCall = async (targetId: string, type: 'audio' | 'video') => {
        if (!user?.id) return;
        const record = await callService.startCallRecord(user.id, targetId, type);
        if (record) {
            // Fetch target user profile for the modal
            const { data } = await insforge.database.from('profiles').select('*').eq('id', targetId).single();
            setTargetUserProfile(data as UserProfile);

            setActiveCall({ id: record.id, isCaller: true, type, targetId });

            // Send signal to target
            await callService.sendSignal('call-request', targetId, { callId: record.id, type }, user.id);
        }
    };

    const handleAcceptCall = async () => {
        if (!incomingCall || !user?.id) return;

        // Fetch caller profile
        const { data } = await insforge.database.from('profiles').select('*').eq('id', incomingCall.from).single();
        setTargetUserProfile(data as UserProfile);

        await callService.updateCallStatus(incomingCall.id, 'accepted');
        await callService.sendSignal('call-accept', incomingCall.from, { callId: incomingCall.id }, user.id);

        setActiveCall({
            id: incomingCall.id,
            isCaller: false,
            type: incomingCall.type,
            targetId: incomingCall.from
        });
        setIncomingCall(null);
    };

    const handleRejectCall = async () => {
        if (!incomingCall || !user?.id) return;
        await callService.updateCallStatus(incomingCall.id, 'rejected');
        await callService.sendSignal('call-reject', incomingCall.from, { callId: incomingCall.id }, user.id);
        setIncomingCall(null);
    };

    if (incomingCall) {
        return (
            <IncomingCallModal
                callId={incomingCall.id}
                callerId={incomingCall.from}
                type={incomingCall.type}
                onAccept={handleAcceptCall}
                onReject={handleRejectCall}
            />
        );
    }

    if (activeCall && user) {
        return (
            <CallModal
                callId={activeCall.id}
                currentUser={user.profile as unknown as UserProfile}
                targetUser={targetUserProfile as UserProfile}
                isCaller={activeCall.isCaller}
                type={activeCall.type}
                onClose={() => setActiveCall(null)}
            />
        );
    }

    return null;
}
