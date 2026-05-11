import { inject, Injectable, signal } from '@angular/core';
import { ELECTRON_API } from '../../shared/electron-api.token';
import type { Task, TaskStatus } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private api = inject(ELECTRON_API);

  private readonly _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();

  async loadAll(): Promise<void> {
    const res = await this.api.tasks.getAll();
    if (res.success && res.data) this._tasks.set(res.data);
  }

  async create(title: string, projectId: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) return;
    const res = await this.api.tasks.create({ title: trimmed, projectId });
    if (res.success && res.data) {
      this._tasks.update(list => [...list, res.data!]);
    }
  }

  async updateTitle(id: string, title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) return;
    const res = await this.api.tasks.updateTitle({ id, title: trimmed });
    if (res.success && res.data) {
      this._tasks.update(list => list.map(t => (t.id === id ? res.data! : t)));
    }
  }

  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    const res = await this.api.tasks.updateStatus({ id, status });
    if (res.success && res.data) {
      this._tasks.update(list => list.map(t => (t.id === id ? res.data! : t)));
    }
  }

  async delete(id: string): Promise<void> {
    const res = await this.api.tasks.delete({ id });
    if (res.success) {
      this._tasks.update(list => list.filter(t => t.id !== id));
    }
  }

  removeByProject(projectId: string): void {
    this._tasks.update(list => list.filter(t => t.projectId !== projectId));
  }
}
