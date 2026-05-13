import { Component, inject, OnInit, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './settings-panel.html',
})
export class SettingsPanelComponent implements OnInit {
  private auth = inject(AuthService);
  private sound = inject(SoundService);

  readonly closed = output<void>();

  protected loginEnabled = signal(false);
  protected currentPw = signal('');
  protected newPw = signal('');
  protected confirmPw = signal('');
  protected pwError = signal('');
  protected pwSuccess = signal('');
  protected isSaving = signal(false);
  protected showPasswords = signal(false);

  ngOnInit(): void {
    this.loginEnabled.set(this.auth.loginEnabled());
  }

  protected async onToggleLogin(event: Event): Promise<void> {
    const enabled = (event.target as HTMLInputElement).checked;
    this.loginEnabled.set(enabled);
    await this.auth.setLoginEnabled(enabled);
    this.sound.play('decision');
  }

  protected async onChangePassword(): Promise<void> {
    this.pwError.set('');
    this.pwSuccess.set('');

    const current = this.currentPw().trim();
    const next = this.newPw().trim();
    const confirm = this.confirmPw().trim();

    if (!current || !next || !confirm) {
      this.pwError.set('All fields are required');
      return;
    }
    if (next.length < 4) {
      this.pwError.set('New password must be at least 4 characters');
      return;
    }
    if (next !== confirm) {
      this.pwError.set('New passwords do not match');
      return;
    }

    this.isSaving.set(true);
    const ok = await this.auth.changePassword(current, next);
    this.isSaving.set(false);

    if (ok) {
      this.pwSuccess.set('Password changed successfully');
      this.currentPw.set('');
      this.newPw.set('');
      this.confirmPw.set('');
      this.sound.play('decision');
    } else {
      this.pwError.set('Current password is incorrect');
      this.sound.play('cancel');
    }
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected clearFeedback(): void {
    this.pwError.set('');
    this.pwSuccess.set('');
  }
}
