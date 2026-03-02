// ===================================================================
// Campusly v4.0 — Audio & Video Calling System
// WebRTC implementation with InsForge Realtime signaling.
// ===================================================================

import { insforge } from '../lib/insforge';

export interface CallRecord {
    id: string;
    caller_id: string;
    receiver_id: string;
    status: 'ringing' | 'accepted' | 'rejected' | 'ended';
    type: 'audio' | 'video';
    started_at?: string;
    ended_at?: string;
    created_at: string;
}

const SIGNAL_CHANNEL = "call-signaling";

class CallService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;

    private config: RTCConfiguration = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    };

    /**
     * Initialize media and peer connection
     */
    async initPeer(isVideo: boolean, onRemoteStream: (stream: MediaStream) => void): Promise<MediaStream> {
        this.peerConnection = new RTCPeerConnection(this.config);

        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: isVideo ? { facingMode: 'user' } : false,
            audio: true
        });

        this.remoteStream = new MediaStream();

        // Add local tracks to peer connection
        this.localStream.getTracks().forEach(track => {
            if (this.localStream && this.peerConnection) {
                this.peerConnection.addTrack(track, this.localStream);
            }
        });

        // Handle remote tracks
        this.peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                this.remoteStream?.addTrack(track);
            });
            onRemoteStream(this.remoteStream!);
        };

        return this.localStream;
    }

    /**
     * Create Offer (Caller side)
     */
    async createOffer(receiverId: string): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error("Peer connection not initialized");

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        return offer;
    }

    /**
     * Handle Offer and Create Answer (Receiver side)
     */
    async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) throw new Error("Peer connection not initialized");

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        return answer;
    }

    /**
     * Handle Answer (Caller side)
     */
    async handleAnswer(answer: RTCSessionDescriptionInit) {
        if (!this.peerConnection) return;
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    /**
     * Handle ICE Candidates
     */
    setupIceCandidates(currentUserId: string, targetUserId: string, onCandidate: (candidate: RTCIceCandidate) => void) {
        if (!this.peerConnection) return;

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                onCandidate(event.candidate);
            }
        };
    }

    async addIceCandidate(candidate: RTCIceCandidateInit) {
        if (this.peerConnection) {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }

    /**
     * Signaling Wrappers
     */
    async sendSignal(event: string, to: string, data: any, from: string) {
        await insforge.realtime.publish(SIGNAL_CHANNEL, event, {
            to,
            from,
            data
        });
    }

    subscribeSignals(userId: string, onSignal: (event: string, from: string, data: any) => void) {
        insforge.realtime.subscribe(SIGNAL_CHANNEL);

        const handler = (payload: any) => {
            if (payload.to === userId) {
                onSignal(payload.meta.event, payload.from, payload.data);
            }
        };

        const events = ['call-request', 'call-accept', 'call-reject', 'offer', 'answer', 'ice-candidate', 'call-end'];
        events.forEach(ev => insforge.realtime.on(ev, handler));

        return () => {
            events.forEach(ev => insforge.realtime.off(ev, handler));
        };
    }

    /**
     * Call State Management
     */
    async startCallRecord(callerId: string, receiverId: string, type: 'audio' | 'video'): Promise<CallRecord | null> {
        const { data, error } = await insforge.database
            .from('calls')
            .insert({
                caller_id: callerId,
                receiver_id: receiverId,
                type,
                status: 'ringing'
            })
            .select()
            .single();

        return error ? null : data;
    }

    async updateCallStatus(callId: string, status: 'accepted' | 'rejected' | 'ended') {
        const update: any = { status };
        if (status === 'accepted') update.started_at = new Date().toISOString();
        if (status === 'ended') update.ended_at = new Date().toISOString();

        await insforge.database
            .from('calls')
            .update(update)
            .eq('id', callId);
    }

    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.remoteStream = null;
    }
}

export const callService = new CallService();
export default callService;
