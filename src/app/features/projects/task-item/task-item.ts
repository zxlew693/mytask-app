import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../../../core/services/task.service';
import { SoundService } from '../../../core/services/sound.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import type { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-item',
  standalone: true,
  templateUrl: './task-item.html',
  styleUrl: './task-item.css',
})
export class TaskItemComponent {
  readonly task = input.required<Task>();
  private taskService = inject(TaskService);
  private sound = inject(SoundService);
  private dialog = inject(MatDialog);

  protected editing = signal(false);
  protected editValue = signal('');
  private editInput = viewChild<ElementRef<HTMLInputElement>>('editInput');

  protected get timestamp(): string {
    const t = this.task();
    if (t.status === 'completed' && t.completedAt)
      return 'Done ' + this.formatDate(t.completedAt);
    if (t.status === 'cancelled' && t.cancelledAt)
      return 'Cancelled ' + this.formatDate(t.cancelledAt);
    return 'Created ' + this.formatDate(t.createdAt);
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  protected startEdit(): void {
    this.editValue.set(this.task().title);
    this.editing.set(true);
    setTimeout(() => {
      const el = this.editInput()?.nativeElement;
      if (el) { el.focus(); el.select(); }
    });
  }

  protected async commitEdit(): Promise<void> {
    const newTitle = this.editValue().trim();
    this.editing.set(false);
    if (newTitle && newTitle !== this.task().title) {
      await this.taskService.updateTitle(this.task().id, newTitle);
    }
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }

  protected onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') { event.preventDefault(); this.commitEdit(); }
    if (event.key === 'Escape') { event.preventDefault(); this.cancelEdit(); }
  }

  protected async onComplete(): Promise<void> {
    this.sound.play('decision');
    await this.taskService.updateStatus(this.task().id, 'completed');
  }

  protected async onCancel(): Promise<void> {
    this.sound.play('cancel');
    await this.taskService.updateStatus(this.task().id, 'cancelled');
  }

  protected async onRestore(): Promise<void> {
    this.sound.play('restore');
    await this.taskService.updateStatus(this.task().id, 'current');
  }

  protected onDelete(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete task',
        message: `"${this.task().title}" will be permanently deleted.`,
      },
      width: '360px',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: false,
    });
    ref.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      await this.taskService.delete(this.task().id);
    });
  }
}
