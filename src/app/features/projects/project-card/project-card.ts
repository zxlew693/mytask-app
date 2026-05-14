import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TaskItemComponent } from '../task-item/task-item';
import { InsightGridComponent } from './insight-grid';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { SoundService } from '../../../core/services/sound.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog';
import type { Project } from '../../../core/models/project.model';
import type { Task, TaskStatus } from '../../../core/models/task.model';

type ActiveTab = TaskStatus | 'insight';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [TaskItemComponent, InsightGridComponent],
  templateUrl: './project-card.html',
  styleUrl: './project-card.css',
})
export class ProjectCardComponent implements OnInit {
  readonly project = input.required<Project>();

  private taskService = inject(TaskService);
  protected projectService = inject(ProjectService);
  private sound = inject(SoundService);
  private dialog = inject(MatDialog);

  protected activeTab = signal<ActiveTab>('current');
  protected isExpanded = signal(true);
  protected newTaskTitle = signal('');

  protected filterYear  = signal<number | 'all'>('all');
  protected filterMonth = signal<number | 'all'>('all');

  protected insightMode = signal<'completed' | 'created' | 'cancelled'>('completed');
  protected readonly insightModes = [
    { value: 'completed' as const, label: 'Completed' },
    { value: 'created' as const, label: 'Created' },
    { value: 'cancelled' as const, label: 'Cancelled' },
  ];

  protected insightYear = signal<number>(new Date().getFullYear());

  constructor() {
    effect(() => {
      this.filterYear();
      this.filterMonth.set('all');
    });
  }

  protected filterYears = computed((): number[] => {
    const projectId = this.project().id;
    const years = new Set<number>();
    for (const task of this.taskService.tasks()) {
      if (task.projectId !== projectId) continue;
      const dates = [task.completedAt, task.cancelledAt];
      for (const d of dates) {
        if (d) years.add(new Date(d).getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  });

  protected filterMonths = computed((): number[] => {
    const year = this.filterYear();
    const projectId = this.project().id;
    if (year === 'all') return Array.from({ length: 12 }, (_, i) => i);
    const months = new Set<number>();
    for (const task of this.taskService.tasks()) {
      if (task.projectId !== projectId) continue;
      const dates = [task.completedAt, task.cancelledAt];
      for (const d of dates) {
        if (!d) continue;
        const dt = new Date(d);
        if (dt.getFullYear() === year) months.add(dt.getMonth());
      }
    }
    return Array.from(months).sort((a, b) => a - b);
  });

  protected insightYears = computed((): number[] => {
    const projectId = this.project().id;
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    for (const task of this.taskService.tasks()) {
      if (task.projectId !== projectId) continue;
      const dates = [task.createdAt, task.completedAt, task.cancelledAt];
      for (const d of dates) {
        if (d) years.add(new Date(d).getFullYear());
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  });

  protected currentTasks = computed(() =>
    this.taskService.tasks().filter(t => t.projectId === this.project().id && t.status === 'current')
  );
  protected completedTasks = computed(() => {
    const base = this.taskService.tasks().filter(t => t.projectId === this.project().id && t.status === 'completed');
    return this.filterByDate(base, 'completedAt');
  });
  protected cancelledTasks = computed(() => {
    const base = this.taskService.tasks().filter(t => t.projectId === this.project().id && t.status === 'cancelled');
    return this.filterByDate(base, 'cancelledAt');
  });
  protected visibleTasks = computed(() => {
    switch (this.activeTab()) {
      case 'completed': return this.completedTasks();
      case 'cancelled': return this.cancelledTasks();
      default:          return this.currentTasks();
    }
  });

  protected insightDayMap = computed((): ReadonlyMap<string, number> => {
    const mode = this.insightMode();
    const projectId = this.project().id;
    const allTasks = this.taskService.tasks();
    const year = this.insightYear();

    const map = new Map<string, number>();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const days = isLeap ? 366 : 365;
    for (let i = 0; i < days; i++) {
      const d = new Date(year, 0, 1 + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, 0);
    }

    for (const task of allTasks) {
      if (task.projectId !== projectId) continue;
      const raw =
        mode === 'created'   ? task.createdAt :
        mode === 'completed' ? task.completedAt :
                               task.cancelledAt;
      if (!raw) continue;
      const dateStr = raw.slice(0, 10);
      if (!map.has(dateStr)) continue;
      map.set(dateStr, (map.get(dateStr) ?? 0) + 1);
    }
    return map;
  });

  private filterByDate(tasks: Task[], dateField: 'completedAt' | 'cancelledAt'): Task[] {
    const year = this.filterYear();
    const month = this.filterMonth();
    return tasks.filter(t => {
      const raw = t[dateField];
      if (!raw) return false;
      if (year === 'all') return true;
      const dt = new Date(raw);
      if (dt.getFullYear() !== year) return false;
      if (month === 'all') return true;
      return dt.getMonth() === month;
    });
  }

  protected monthName(month: number): string {
    return new Date(2000, month, 1).toLocaleString(undefined, { month: 'long' });
  }

  ngOnInit(): void {
    // Tasks already loaded globally in AppComponent; nothing extra needed
  }

  protected onTitleChange(event: Event): void {
    this.newTaskTitle.set((event.target as HTMLInputElement).value);
  }

  protected async onAddTask(): Promise<void> {
    const title = this.newTaskTitle().trim();
    if (!title) return;
    this.sound.play('decision');
    await this.taskService.create(title, this.project().id);
    this.newTaskTitle.set('');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onAddTask();
  }

  protected onClosePanel(): void {
    this.sound.play('close');
    this.projectService.toggleOpen(this.project().id);
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
