import { inject, Injectable, signal } from '@angular/core';
import { ELECTRON_API } from '../../shared/electron-api.token';
import { NotesCryptoService } from './notes-crypto.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ELECTRON_API);
  private notesCrypto = inject(NotesCryptoService);

  private readonly _isAuthenticated = signal(false);
  private readonly _loginEnabled = signal(false);
  private _passwordHash = '';
  private _notesSalt = '';

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly loginEnabled = this._loginEnabled.asReadonly();

  async init(): Promise<void> {
    const settings = await this.api.settings.get();
    this._loginEnabled.set(settings.loginEnabled);

    if (!settings.passwordHash) {
      const hash = await this.hashPassword('admin');
      await this.api.settings.save({ passwordHash: hash });
      this._passwordHash = hash;
    } else {
      this._passwordHash = settings.passwordHash;
    }

    if (!settings.notesSalt) {
      const saltBytes = crypto.getRandomValues(new Uint8Array(32));
      const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      await this.api.settings.save({ notesSalt: saltHex });
      this._notesSalt = saltHex;
    } else {
      this._notesSalt = settings.notesSalt;
    }

    if (!settings.loginEnabled) {
      this._isAuthenticated.set(true);
      await this.notesCrypto.deriveKey('mytask-notes-default-key-v1', this._notesSalt);
    }
  }

  async login(password: string): Promise<boolean> {
    const hash = await this.hashPassword(password);
    if (hash === this._passwordHash) {
      this._isAuthenticated.set(true);
      await this.notesCrypto.deriveKey(password, this._notesSalt);
      return true;
    }
    return false;
  }

  async changePassword(current: string, next: string): Promise<boolean> {
    const currentHash = await this.hashPassword(current);
    if (currentHash !== this._passwordHash) return false;
    const newHash = await this.hashPassword(next);
    await this.api.settings.save({ passwordHash: newHash });
    this._passwordHash = newHash;
    return true;
  }

  lock(): void {
    this._isAuthenticated.set(false);
    this.notesCrypto.clearKey();
  }

  async setLoginEnabled(enabled: boolean): Promise<void> {
    await this.api.settings.save({ loginEnabled: enabled });
    this._loginEnabled.set(enabled);
    if (!enabled) {
      this._isAuthenticated.set(true);
    }
  }

  private async hashPassword(pw: string): Promise<string> {
    const encoded = new TextEncoder().encode(pw);
    const buffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
