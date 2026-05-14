import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { ProjectCardComponent } from '../project-card/project-card';
import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import type { TaskStatus } from '../../../core/models/task.model';

interface ExportFile {
  version: 1;
  exportedAt: string;
  projects: ExportedProject[];
}

interface ExportedProject {
  id: string;
  name: string;
  createdAt: string;
  tasks: ExportedTask[];
}

interface ExportedTask {
  id: string;
  title: string;
  projectId: string;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [ProjectCardComponent],
  templateUrl: './project-board.html',
  styleUrl: './project-board.css',
})
export class ProjectBoardComponent {
  protected projectService = inject(ProjectService);
  protected taskService = inject(TaskService);

  protected panelMode = signal<'export' | 'import' | null>(null);

  protected exportSelectedIds = signal<Set<string>>(new Set());
  protected allExportSelected = computed(() =>
    this.projectService.projects().length > 0 &&
    this.projectService.projects().every(p => this.exportSelectedIds().has(p.id))
  );

  protected importStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  protected importMessage = signal<string>('');

  @ViewChild('fileInput') protected fileInputEl!: ElementRef<HTMLInputElement>;

  protected openExportPanel(): void {
    this.exportSelectedIds.set(new Set(this.projectService.projects().map(p => p.id)));
    this.panelMode.set('export');
  }

  protected openImportPanel(): void {
    this.importStatus.set('idle');
    this.importMessage.set('');
    this.panelMode.set('import');
  }

  protected closePanel(): void {
    this.panelMode.set(null);
    this.importStatus.set('idle');
    this.importMessage.set('');
  }

  protected toggleExportProject(id: string): void {
    this.exportSelectedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected toggleSelectAll(): void {
    if (this.allExportSelected()) {
      this.exportSelectedIds.set(new Set());
    } else {
      this.exportSelectedIds.set(new Set(this.projectService.projects().map(p => p.id)));
    }
  }

  protected taskCountForProject(projectId: string): number {
    return this.taskService.tasks().filter(t => t.projectId === projectId).length;
  }

  protected runExport(): void {
    const selectedIds = this.exportSelectedIds();
    if (selectedIds.size === 0) return;

    const allTasks = this.taskService.tasks();
    const payload: ExportFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: this.projectService.projects()
        .filter(p => selectedIds.has(p.id))
        .map(p => ({
          ...p,
          tasks: allTasks.filter(t => t.projectId === p.id),
        })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mytask-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.closePanel();
  }

  protected triggerFileInput(): void {
    this.fileInputEl.nativeElement.click();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importStatus.set('loading');
    this.importMessage.set('');

    let data: ExportFile;
    try {
      data = JSON.parse(await file.text()) as ExportFile;
    } catch {
      this.importStatus.set('error');
      this.importMessage.set('Invalid file — could not parse JSON.');
      input.value = '';
      return;
    }

    if (!this.isValidExportFile(data)) {
      this.importStatus.set('error');
      this.importMessage.set('File format not recognised. Make sure it is a My Task export file.');
      input.value = '';
      return;
    }

    let projectsImported = 0;
    let tasksImported = 0;

    for (const exportedProject of data.projects) {
      const before = this.projectService.projects().map(p => p.id);
      await this.projectService.create(exportedProject.name);
      const newProject = this.projectService.projects().find(p => !before.includes(p.id));
      if (!newProject) continue;
      projectsImported++;

      for (const task of exportedProject.tasks) {
        await this.taskService.create(task.title, newProject.id);
        if (task.status !== 'current') {
          const newTask = this.taskService.tasks().find(
            t => t.projectId === newProject.id && t.title === task.title && t.status === 'current'
          );
          if (newTask) await this.taskService.updateStatus(newTask.id, task.status);
        }
        tasksImported++;
      }
    }

    this.importStatus.set('success');
    this.importMessage.set(
      `Imported ${projectsImported} project${projectsImported !== 1 ? 's' : ''} and ${tasksImported} task${tasksImported !== 1 ? 's' : ''}.`
    );
    input.value = '';
  }

  private isValidExportFile(data: unknown): data is ExportFile {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    if (d['version'] !== 1) return false;
    if (typeof d['exportedAt'] !== 'string') return false;
    if (!Array.isArray(d['projects'])) return false;
    for (const p of d['projects'] as unknown[]) {
      if (typeof p !== 'object' || p === null) return false;
      const proj = p as Record<string, unknown>;
      if (typeof proj['id'] !== 'string') return false;
      if (typeof proj['name'] !== 'string') return false;
      if (!Array.isArray(proj['tasks'])) return false;
    }
    return true;
  }
}
