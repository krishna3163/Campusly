/**
 * EncryptionService — E2E encryption for private chats
 * Uses Web Crypto API (AES-GCM + ECDH key exchange)
 */

class EncryptionService {
    private keyPair: CryptoKeyPair | null = null;
    private sharedKeys: Map<string, CryptoKey> = new Map();

    // === KEY GENERATION ===

    async generateKeyPair(): Promise<JsonWebKey> {
        this.keyPair = await crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveKey']
        );
        return await crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
    }

    async deriveSharedKey(peerId: string, peerPublicKeyJwk: JsonWebKey): Promise<void> {
        if (!this.keyPair) throw new Error('Key pair not generated');

        const peerPublicKey = await crypto.subtle.importKey(
            'jwk',
            peerPublicKeyJwk,
            { name: 'ECDH', namedCurve: 'P-256' },
            false,
            []
        );

        const sharedKey = await crypto.subtle.deriveKey(
            { name: 'ECDH', public: peerPublicKey },
            this.keyPair.privateKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        this.sharedKeys.set(peerId, sharedKey);
    }

    // === ENCRYPT / DECRYPT ===

    async encrypt(peerId: string, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
        const key = this.sharedKeys.get(peerId);
        if (!key) throw new Error(`No shared key for peer ${peerId}`);

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plaintext);

        const cipherBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );

        return {
            ciphertext: this.bufferToBase64(cipherBuffer),
            iv: this.bufferToBase64(iv.buffer),
        };
    }

    async decrypt(peerId: string, ciphertext: string, iv: string): Promise<string> {
        const key = this.sharedKeys.get(peerId);
        if (!key) throw new Error(`No shared key for peer ${peerId}`);

        const cipherBuffer = this.base64ToBuffer(ciphertext);
        const ivBuffer = new Uint8Array(this.base64ToBuffer(iv));

        const plainBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBuffer },
            key,
            cipherBuffer
        );

        return new TextDecoder().decode(plainBuffer);
    }

    // === LOCAL DB ENCRYPTION ===

    async encryptLocal(data: string): Promise<string> {
        const key = await this.getLocalEncryptionKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(data);

        const cipherBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
        );

        const combined = new Uint8Array(iv.length + new Uint8Array(cipherBuffer).length);
        combined.set(iv);
        combined.set(new Uint8Array(cipherBuffer), iv.length);

        return this.bufferToBase64(combined.buffer);
    }

    async decryptLocal(encrypted: string): Promise<string> {
        const key = await this.getLocalEncryptionKey();
        const combined = new Uint8Array(this.base64ToBuffer(encrypted));

        const iv = combined.slice(0, 12);
        const cipherBuffer = combined.slice(12);

        const plainBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            cipherBuffer
        );

        return new TextDecoder().decode(plainBuffer);
    }

    hasSharedKey(peerId: string): boolean {
        return this.sharedKeys.has(peerId);
    }

    // === PRIVATE HELPERS ===

    private async getLocalEncryptionKey(): Promise<CryptoKey> {
        const storedKey = localStorage.getItem('campusly_local_key');
        if (storedKey) {
            return await crypto.subtle.importKey(
                'jwk',
                JSON.parse(storedKey),
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        }

        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        const exported = await crypto.subtle.exportKey('jwk', key);
        localStorage.setItem('campusly_local_key', JSON.stringify(exported));
        return key;
    }

    private bufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    }

    private base64ToBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

export const encryptionService = new EncryptionService();
