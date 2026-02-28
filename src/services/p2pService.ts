/**
 * P2PService — WebRTC DataChannel file transfer with QR/PIN pairing
 */

type P2PListener = (event: P2PEvent) => void;

export interface P2PEvent {
    type: 'pairing' | 'connected' | 'progress' | 'completed' | 'failed' | 'disconnected';
    peerId?: string;
    fileName?: string;
    fileSize?: number;
    transferred?: number;
    error?: string;
    pairingCode?: string;
}

interface ChunkedFile {
    name: string;
    size: number;
    type: string;
    totalChunks: number;
}

const CHUNK_SIZE = 16 * 1024; // 16KB chunks for reliability

class P2PService {
    private peerConnection: RTCPeerConnection | null = null;
    private dataChannel: RTCDataChannel | null = null;
    private listeners: Set<P2PListener> = new Set();
    private receivedChunks: Map<string, ArrayBuffer[]> = new Map();
    private currentFile: ChunkedFile | null = null;
    private pairingPin: string | null = null;

    // === PUBLIC API ===

    subscribe(listener: P2PListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    generatePairingCode(): string {
        this.pairingPin = Math.floor(100000 + Math.random() * 900000).toString();
        this.emit({ type: 'pairing', pairingCode: this.pairingPin });
        return this.pairingPin;
    }

    validatePin(pin: string): boolean {
        return this.pairingPin === pin;
    }

    async startAsInitiator(): Promise<RTCSessionDescriptionInit> {
        this.createPeerConnection();

        this.dataChannel = this.peerConnection!.createDataChannel('fileTransfer', {
            ordered: true,
        });
        this.setupDataChannel(this.dataChannel);

        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);

        return offer;
    }

    async acceptOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        this.createPeerConnection();

        this.peerConnection!.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannel(this.dataChannel);
        };

        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);

        return answer;
    }

    async setAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    }

    async sendFile(file: File): Promise<void> {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            this.emit({ type: 'failed', error: 'Data channel not open' });
            return;
        }

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const header: ChunkedFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            totalChunks,
        };

        // Send file header
        this.dataChannel.send(JSON.stringify({ type: 'file_header', ...header }));

        // Send chunks
        let offset = 0;
        let chunkIndex = 0;

        const sendNextChunk = () => {
            if (offset >= file.size) {
                this.dataChannel!.send(JSON.stringify({ type: 'file_complete' }));
                this.emit({ type: 'completed', fileName: file.name, fileSize: file.size });
                return;
            }

            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                    try {
                        this.dataChannel!.send(reader.result);
                        chunkIndex++;
                        offset += CHUNK_SIZE;
                        this.emit({
                            type: 'progress',
                            fileName: file.name,
                            fileSize: file.size,
                            transferred: Math.min(offset, file.size),
                        });
                        // Small delay to avoid overwhelming the channel
                        setTimeout(sendNextChunk, 0);
                    } catch (err) {
                        this.emit({ type: 'failed', error: `Send failed at chunk ${chunkIndex}` });
                    }
                }
            };
            reader.readAsArrayBuffer(chunk);
        };

        sendNextChunk();
    }

    disconnect(): void {
        this.dataChannel?.close();
        this.peerConnection?.close();
        this.dataChannel = null;
        this.peerConnection = null;
        this.receivedChunks.clear();
        this.currentFile = null;
        this.pairingPin = null;
        this.emit({ type: 'disconnected' });
    }

    // === PRIVATE ===

    private createPeerConnection(): void {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        });

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // In production, send via signaling server
                console.log('[P2P] ICE candidate:', event.candidate);
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            if (state === 'connected') {
                this.emit({ type: 'connected' });
            } else if (state === 'failed' || state === 'disconnected') {
                this.emit({ type: 'disconnected' });
            }
        };
    }

    private setupDataChannel(channel: RTCDataChannel): void {
        channel.binaryType = 'arraybuffer';

        channel.onopen = () => {
            this.emit({ type: 'connected' });
        };

        channel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                const msg = JSON.parse(event.data);

                if (msg.type === 'file_header') {
                    this.currentFile = msg;
                    this.receivedChunks.set(msg.name, []);
                } else if (msg.type === 'file_complete') {
                    this.assembleReceivedFile();
                }
            } else if (event.data instanceof ArrayBuffer) {
                if (this.currentFile) {
                    const chunks = this.receivedChunks.get(this.currentFile.name);
                    if (chunks) {
                        chunks.push(event.data);
                        const transferred = chunks.reduce((sum, c) => sum + c.byteLength, 0);
                        this.emit({
                            type: 'progress',
                            fileName: this.currentFile.name,
                            fileSize: this.currentFile.size,
                            transferred,
                        });
                    }
                }
            }
        };

        channel.onerror = (err) => {
            this.emit({ type: 'failed', error: String(err) });
        };

        channel.onclose = () => {
            this.emit({ type: 'disconnected' });
        };
    }

    private assembleReceivedFile(): void {
        if (!this.currentFile) return;

        const chunks = this.receivedChunks.get(this.currentFile.name);
        if (!chunks) return;

        const blob = new Blob(chunks, { type: this.currentFile.type });
        const url = URL.createObjectURL(blob);

        // Auto-download
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile.name;
        a.click();
        URL.revokeObjectURL(url);

        this.emit({
            type: 'completed',
            fileName: this.currentFile.name,
            fileSize: this.currentFile.size,
        });

        this.receivedChunks.delete(this.currentFile.name);
        this.currentFile = null;
    }

    private emit(event: P2PEvent): void {
        this.listeners.forEach(l => l(event));
    }
}

export const p2pService = new P2PService();
