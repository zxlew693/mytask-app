import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProjectService } from '../../core/services/project.service';
import { NoteService } from '../../core/services/note.service';
import { SoundService } from '../../core/services/sound.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  protected projectService = inject(ProjectService);
  protected noteService = inject(NoteService);
  private sound = inject(SoundService);
  private dialog = inject(MatDialog);
  protected activeTab = this.noteService.sidebarTab;

  // --- project state ---
  protected showInput = signal(false);
  protected newName = signal('');
  protected searchQuery = signal('');
  protected editingId = signal<string | null>(null);
  protected editingName = signal('');

  protected filteredProjects = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.projectService.projects();
    return this.projectService.projects().filter(p => p.name.toLowerCase().includes(q));
  });

  protected dropIndex = signal<number | null>(null);
  private dragFromIndex: number | null = null;

  // --- note state ---
  protected showNoteInput = signal(false);
  protected newNoteTitle = signal('');
  protected noteDropIndex = signal<number | null>(null);
  private noteDragFromIndex: number | null = null;

  // --- project methods ---

  protected onInputChange(event: Event): void {
    this.newName.set((event.target as HTMLInputElement).value);
  }

  protected async onAdd(): Promise<void> {
    const name = this.newName().trim();
    if (!name) return;
    this.sound.play('decision');
    await this.projectService.create(name);
    this.newName.set('');
    this.showInput.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onAdd();
    if (event.key === 'Escape') {
      this.showInput.set(false);
      this.newName.set('');
    }
  }

  protected onSelect(id: string): void {
    this.sound.play('select');
    this.projectService.select(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  protected onToggleOpen(id: string): void {
    this.sound.play(this.projectService.isOpen(id) ? 'close' : 'open');
    this.projectService.toggleOpen(id);
  }

  protected onOpenAll(): void {
    this.sound.play('open');
    this.projectService.openAll();
  }

  protected onEditStart(event: MouseEvent, project: { id: string; name: string }): void {
    event.stopPropagation();
    this.editingId.set(project.id);
    this.editingName.set(project.name);
  }

  protected onEditChange(event: Event): void {
    this.editingName.set((event.target as HTMLInputElement).value);
  }

  protected async onEditCommit(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    this.sound.play('decision');
    await this.projectService.rename(id, this.editingName());
    this.editingId.set(null);
  }

  protected onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onEditCommit();
    if (event.key === 'Escape') this.editingId.set(null);
  }

  protected onDragStart(event: DragEvent, index: number): void {
    this.dragFromIndex = index;
    event.dataTransfer!.effectAllowed = 'move';
  }

  protected onDragOver(event: DragEvent, index: number): void {
    if (this.dragFromIndex === null) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    const el = event.currentTarget as HTMLElement;
    const { top, height } = el.getBoundingClientRect();
    const insertBefore = event.clientY < top + height / 2;
    this.dropIndex.set(insertBefore ? index : index + 1);
  }

  protected onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    const list = (event.currentTarget as HTMLElement).closest('ul');
    if (list && related && list.contains(related)) return;
    this.dropIndex.set(null);
  }

  protected onDrop(event: DragEvent, toIndex: number): void {
    event.preventDefault();
    const from = this.dragFromIndex;
    const to = this.dropIndex();
    if (from !== null && to !== null) {
      const adjusted = to > from ? to - 1 : to;
      if (adjusted !== from) this.projectService.reorder(from, adjusted);
    }
    this.dragFromIndex = null;
    this.dropIndex.set(null);
  }

  protected onDragEnd(): void {
    this.dragFromIndex = null;
    this.dropIndex.set(null);
  }

  protected isDragging(index: number): boolean {
    return this.dragFromIndex === index;
  }

  // --- note drag methods ---

  protected onNoteDragStart(event: DragEvent, index: number): void {
    this.noteDragFromIndex = index;
    event.dataTransfer!.effectAllowed = 'move';
  }

  protected onNoteDragOver(event: DragEvent, index: number): void {
    if (this.noteDragFromIndex === null) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    const el = event.currentTarget as HTMLElement;
    const { top, height } = el.getBoundingClientRect();
    const insertBefore = event.clientY < top + height / 2;
    this.noteDropIndex.set(insertBefore ? index : index + 1);
  }

  protected onNoteDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    const list = (event.currentTarget as HTMLElement).closest('ul');
    if (list && related && list.contains(related)) return;
    this.noteDropIndex.set(null);
  }

  protected onNoteDrop(event: DragEvent): void {
    event.preventDefault();
    const from = this.noteDragFromIndex;
    const to = this.noteDropIndex();
    if (from !== null && to !== null) {
      const adjusted = to > from ? to - 1 : to;
      if (adjusted !== from) this.noteService.reorder(from, adjusted);
    }
    this.noteDragFromIndex = null;
    this.noteDropIndex.set(null);
  }

  protected onNoteDragEnd(): void {
    this.noteDragFromIndex = null;
    this.noteDropIndex.set(null);
  }

  protected isNoteDragging(index: number): boolean {
    return this.noteDragFromIndex === index;
  }

  // --- note methods ---

  protected onNoteInputChange(event: Event): void {
    this.newNoteTitle.set((event.target as HTMLInputElement).value);
  }

  protected async onAddNote(): Promise<void> {
    const title = this.newNoteTitle().trim();
    if (!title) return;
    this.sound.play('decision');
    const note = await this.noteService.create(title);
    this.newNoteTitle.set('');
    this.showNoteInput.set(false);
    await this.noteService.selectNote(note.id);
  }

  protected onNoteKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onAddNote();
    if (event.key === 'Escape') {
      this.showNoteInput.set(false);
      this.newNoteTitle.set('');
    }
  }

  protected async onSelectNote(id: string): Promise<void> {
    this.sound.play('select');
    await this.noteService.selectNote(id);
  }

  protected onDeleteNote(event: MouseEvent, note: { id: string; title: string }): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete note',
        message: `"${note.title}" will be permanently deleted.`,
      },
      width: '360px',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: false,
    });
    ref.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      this.sound.play('close');
      await this.noteService.delete(note.id);
    });
  }
}
