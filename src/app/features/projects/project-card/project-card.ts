import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskItemComponent } from '../task-item/task-item';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import type { Project } from '../../../core/models/project.model';
import type { TaskStatus } from '../../../core/models/task.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [TaskItemComponent],
  templateUrl: './project-card.html',
  styleUrl: './project-card.css',
})
export class ProjectCardComponent implements OnInit {
  readonly project = input.required<Project>();

  private taskService = inject(TaskService);
  protected projectService = inject(ProjectService);
  private dialog = inject(MatDialog);

  protected activeTab = signal<TaskStatus>('current');
  protected isExpanded = signal(true);
  protected newTaskTitle = signal('');

  protected currentTasks = computed(() =>
    this.taskService.tasks().filter(t => t.projectId === this.project().id && t.status === 'current')
  );
  protected completedTasks = computed(() =>
    this.taskService.tasks().filter(t => t.projectId === this.project().id && t.status === 'completed')
  );
  protected cancelledTasks = computed(() =>
    this.taskService.tasks().filter(t => t.projectId === this.project().id && t.status === 'cancelled')
  );
  protected visibleTasks = computed(() => {
    switch (this.activeTab()) {
      case 'completed': return this.completedTasks();
      case 'cancelled': return this.cancelledTasks();
      default:          return this.currentTasks();
    }
  });

  ngOnInit(): void {
    // Tasks already loaded globally in AppComponent; nothing extra needed
  }

  protected onTitleChange(event: Event): void {
    this.newTaskTitle.set((event.target as HTMLInputElement).value);
  }

  protected async onAddTask(): Promise<void> {
    const title = this.newTaskTitle().trim();
    if (!title) return;
    await this.taskService.create(title, this.project().id);
    this.newTaskTitle.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onAddTask();
  }

  protected onDeleteProject(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete project',
        message: `"${this.project().name}" and all its tasks will be permanently deleted.`,
      },
      width: '360px',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: false,
    });
    ref.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      this.taskService.removeByProject(this.project().id);
      await this.projectService.delete(this.project().id);
    });
  }
}
