import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private sound = inject(SoundService);

  protected password = signal('');
  protected errorMessage = signal('');
  protected isLoading = signal(false);

  protected async onSubmit(): Promise<void> {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    const ok = await this.auth.login(this.password());
    if (ok) {
      this.sound.play('decision');
    } else {
      this.errorMessage.set('Incorrect password');
      this.sound.play('cancel');
      this.isLoading.set(false);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onSubmit();
  }
}
