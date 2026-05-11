import { Component, computed, inject, signal } from '@angular/core';
import { ProjectService } from '../../core/services/project.service';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  protected projectService = inject(ProjectService);
  private sound = inject(SoundService);
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

  // null = no drag; number = insert-before index (items.length = append at end)
  protected dropIndex = signal<number | null>(null);
  private dragFromIndex: number | null = null;

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
    // Defer so the browser snapshot is taken before the style is applied
    requestAnimationFrame(() => this.dropIndex.set(-1));
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
    // Only clear when leaving the <ul>, not when moving between children
    const related = event.relatedTarget as Node | null;
    const list = (event.currentTarget as HTMLElement).closest('ul');
    if (list && related && list.contains(related)) return;
    this.dropIndex.set(null);
  }

  protected onDrop(event: DragEvent, toIndex: number): void {
    event.preventDefault();
    const from = this.dragFromIndex;
    const to = this.dropIndex();
    if (from !== null && to !== null && to !== -1) {
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
}
