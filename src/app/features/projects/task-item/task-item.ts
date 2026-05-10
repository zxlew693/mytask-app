import { Component, inject, input } from '@angular/core';
import { TaskService } from '../../../core/services/task.service';
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

  protected async onComplete(): Promise<void> {
    await this.taskService.updateStatus(this.task().id, 'completed');
  }

  protected async onCancel(): Promise<void> {
    await this.taskService.updateStatus(this.task().id, 'cancelled');
  }

  protected async onRestore(): Promise<void> {
    await this.taskService.updateStatus(this.task().id, 'current');
  }

  protected async onDelete(): Promise<void> {
    await this.taskService.delete(this.task().id);
  }
}
