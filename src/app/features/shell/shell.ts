import { Component, inject, signal } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar';
import { ProjectBoardComponent } from '../projects/project-board/project-board';
import { NotesEditorComponent } from '../notes/notes-editor';
import { ThemeService } from '../../core/services/theme.service';
import { SoundService } from '../../core/services/sound.service';
import { AuthService } from '../../core/services/auth.service';
import { NoteService } from '../../core/services/note.service';
import { NotesCryptoService } from '../../core/services/notes-crypto.service';
import { SettingsPanelComponent } from '../settings/settings-panel';

const MIN_WIDTH = 160;
const MAX_WIDTH = 400;

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SidebarComponent, ProjectBoardComponent, NotesEditorComponent, SettingsPanelComponent],
  templateUrl: './shell.html',
})
export class ShellComponent {
  theme = inject(ThemeService);
  sound = inject(SoundService);
  auth = inject(AuthService);
  protected noteService = inject(NoteService);
  protected cryptoService = inject(NotesCryptoService);
  sidebarWidth = signal(240);
  isMaximized = signal(false);
  settingsOpen = signal(false);

  openSettings(): void { this.settingsOpen.set(true); }
  closeSettings(): void { this.settingsOpen.set(false); }

  constructor() {
    window.electronAPI?.window.onMaximizeChange(v => this.isMaximized.set(v));
  }

  close(): void {
    window.electronAPI?.window.close();
  }

  minimize(): void {
    window.electronAPI?.window.minimize();
  }

  maximize(): void {
    window.electronAPI?.window.maximize();
  }

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = this.sidebarWidth();

    const onMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      this.sidebarWidth.set(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
}
