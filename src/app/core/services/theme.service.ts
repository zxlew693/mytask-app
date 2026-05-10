import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  constructor() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDark.set(stored ? stored === 'dark' : prefersDark);
    this.apply();
  }

  toggle(): void {
    this.isDark.set(!this.isDark());
    localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    this.apply();
  }

  private apply(): void {
    document.documentElement.classList.toggle('dark', this.isDark());
  }
}
