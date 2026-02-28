// ===================================================================
// Campusly v3.0 — Call Signaling Service
// WebRTC call management with InsForge Realtime for signaling.
// Supports: 1-1 voice, 1-1 video, group voice, group video.
// ===================================================================

import { insforge } from '../lib/insforge';
import type { Call, CallType, CallStatus, CallParticipant } from '../types/messaging';

// Default ICE servers (STUN + TURN)
const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN server should be configured in production
    // { urls: 'turn:turn.campusly.app:3478', username: '...', credential: '...' },
];

/**
 * Initiate a new call.
 */
export async function initiateCall(
    conversationId: string,
    userId: string,
    type: CallType
): Promise<Call | null> {
    const { data, error } = await insforge.database
        .from('calls')
        .insert({
            conversation_id: conversationId,
            type,
            status: 'ringing',
            initiated_by: userId,
            ice_servers: ICE_SERVERS,
        })
        .select()
        .single();

    if (error || !data) {
        console.error('Failed to initiate call:', error);
        return null;
    }

    // Add initiator as first participant
    await insforge.database
        .from('call_participants')
        .insert({
            call_id: data.id,
            user_id: userId,
        });

    return data as Call;
}

/**
 * Accept an incoming call.
 */
export async function acceptCall(callId: string, userId: string): Promise<boolean> {
    const { error } = await insforge.database
        .from('calls')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', callId);

    if (error) return false;

    await insforge.database
        .from('call_participants')
        .insert({ call_id: callId, user_id: userId });

    return true;
}

/**
 * Decline or end a call.
 */
export async function endCall(callId: string, status: 'ended' | 'declined' | 'missed' = 'ended'): Promise<void> {
    await insforge.database
        .from('calls')
        .update({
            status,
            ended_at: new Date().toISOString(),
        })
        .eq('id', callId);
}

/**
 * Toggle participant media state.
 */
export async function toggleParticipantState(
    callId: string,
    userId: string,
    field: 'is_muted' | 'is_camera_off' | 'is_screen_sharing',
    value: boolean
): Promise<void> {
    await insforge.database
        .from('call_participants')
        .update({ [field]: value })
        .eq('call_id', callId)
        .eq('user_id', userId);
}

/**
 * Leave a call (for group calls where the call continues).
 */
export async function leaveCall(callId: string, userId: string): Promise<void> {
    await insforge.database
        .from('call_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('call_id', callId)
        .eq('user_id', userId);
}

/**
 * Get call history for a conversation.
 */
export async function getCallHistory(conversationId: string, limit = 20): Promise<Call[]> {
    const { data } = await insforge.database
        .from('calls')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return (data as Call[]) || [];
}

/**
 * Subscribe to call events for a conversation.
 */
export function subscribeToCallEvents(
    conversationId: string,
    onCallEvent: (call: Call, eventType: 'INSERT' | 'UPDATE') => void
): () => void {
    const channel = insforge.realtime
        .channel(`calls:${conversationId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'calls',
            filter: `conversation_id=eq.${conversationId}`,
        }, (payload: any) => {
            if (payload.new) {
                onCallEvent(payload.new as Call, payload.eventType as 'INSERT' | 'UPDATE');
            }
        })
        .subscribe();

    return () => {
        insforge.realtime.removeChannel(channel);
    };
}

/**
 * Subscribe to participant changes in an active call.
 */
export function subscribeToParticipants(
    callId: string,
    onParticipantChange: (participant: CallParticipant, eventType: string) => void
): () => void {
    const channel = insforge.realtime
        .channel(`call_participants:${callId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'call_participants',
            filter: `call_id=eq.${callId}`,
        }, (payload: any) => {
            const record = payload.new || payload.old;
            if (record) {
                onParticipantChange(record as CallParticipant, payload.eventType);
            }
        })
        .subscribe();

    return () => {
        insforge.realtime.removeChannel(channel);
    };
}

/**
 * Create a WebRTC peer connection with standard configuration.
 */
export function createPeerConnection(): RTCPeerConnection {
    return new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
    });
}

/**
 * Send a signaling message (SDP offer/answer or ICE candidate) via Realtime.
 */
export function sendSignal(
    conversationId: string,
    signalType: 'offer' | 'answer' | 'ice-candidate',
    data: any,
    fromUserId: string,
    toUserId?: string
) {
    const channel = insforge.realtime.channel(`signal:${conversationId}`);
    channel.send({
        type: 'broadcast',
        event: signalType,
        payload: {
            from: fromUserId,
            to: toUserId,
            data,
        },
    });
}

/**
 * Listen for signaling messages.
 */
export function listenForSignals(
    conversationId: string,
    userId: string,
    onSignal: (signalType: string, data: any, fromUserId: string) => void
): () => void {
    const channel = insforge.realtime
        .channel(`signal:${conversationId}`)
        .on('broadcast', { event: 'offer' }, (payload: any) => {
            if (payload.payload?.to === userId || !payload.payload?.to) {
                onSignal('offer', payload.payload.data, payload.payload.from);
            }
        })
        .on('broadcast', { event: 'answer' }, (payload: any) => {
            if (payload.payload?.to === userId || !payload.payload?.to) {
                onSignal('answer', payload.payload.data, payload.payload.from);
            }
        })
        .on('broadcast', { event: 'ice-candidate' }, (payload: any) => {
            if (payload.payload?.to === userId || !payload.payload?.to) {
                onSignal('ice-candidate', payload.payload.data, payload.payload.from);
            }
        })
        .subscribe();

    return () => {
        insforge.realtime.removeChannel(channel);
    };
}
