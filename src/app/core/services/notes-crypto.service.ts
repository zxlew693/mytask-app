import { computed, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotesCryptoService {
  private _key = signal<CryptoKey | null>(null);
  readonly hasKey = computed(() => this._key() !== null);

  async deriveKey(passphrase: string, saltHex: string): Promise<void> {
    const saltBuf = this.hexToBuffer(saltHex);
    const passphraseBuf = new TextEncoder().encode(passphrase).buffer as ArrayBuffer;
    const baseKey = await crypto.subtle.importKey('raw', passphraseBuf, 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBuf, iterations: 200_000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    this._key.set(key);
  }

  clearKey(): void {
    this._key.set(null);
  }

  async encrypt(plaintext: string): Promise<string> {
    const key = this._key();
    if (!key) throw new Error('No encryption key available');
    const ivBuf = crypto.getRandomValues(new Uint8Array(12)).buffer as ArrayBuffer;
    const data = new TextEncoder().encode(plaintext).buffer as ArrayBuffer;
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivBuf }, key, data);
    const ivHex = this.bufferToHex(ivBuf);
    const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuf)));
    return ivHex + cipherB64;
  }

  async decrypt(blob: string): Promise<string> {
    const key = this._key();
    if (!key) throw new Error('No encryption key available');
    const ivBuf = this.hexToBuffer(blob.slice(0, 24));
    const cipherBuf = Uint8Array.from(atob(blob.slice(24)), c => c.charCodeAt(0)).buffer as ArrayBuffer;
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, key, cipherBuf);
    return new TextDecoder().decode(plainBuf);
  }

  private hexToBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer as ArrayBuffer;
  }

  private bufferToHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
