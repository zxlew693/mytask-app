import { Injectable, signal } from '@angular/core';

type SoundName = 'select' | 'open' | 'close' | 'cancel' | 'restore' | 'delete' | 'decision';

@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly muted = signal(false);
  private cache = new Map<SoundName, HTMLAudioElement>();

  toggleMute(): void {
    this.muted.update(v => !v);
  }

  play(name: SoundName): void {
    if (this.muted()) return;
    let audio = this.cache.get(name);
    if (!audio) {
      audio = new Audio(`sound/${name}.wav`);
      this.cache.set(name, audio);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}
