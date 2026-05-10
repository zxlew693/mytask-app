import { inject, Injectable, signal } from '@angular/core';
import { ELECTRON_API } from '../../shared/electron-api.token';
import type { Project } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private api = inject(ELECTRON_API);

  private readonly _projects = signal<Project[]>([]);
  readonly projects = this._projects.asReadonly();

  readonly selectedProjectId = signal<string | null>(null);

  private readonly _openedIds = signal<Set<string>>(new Set());
  readonly openedIds = this._openedIds.asReadonly();

  toggleOpen(id: string): void {
    this._openedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isOpen(id: string): boolean {
    return this._openedIds().has(id);
  }

  async loadAll(): Promise<void> {
    const res = await this.api.projects.getAll();
    if (res.success && res.data) this._projects.set(res.data);
  }

  async create(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    const res = await this.api.projects.create({ name: trimmed });
    if (res.success && res.data) {
      this._projects.update(list => [...list, res.data!]);
    }
  }

  async rename(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    const res = await this.api.projects.rename({ id, name: trimmed });
    if (res.success && res.data) {
      this._projects.update(list => list.map(p => p.id === id ? res.data! : p));
    }
  }

  async delete(id: string): Promise<void> {
    const res = await this.api.projects.delete({ id });
    if (res.success) {
      this._projects.update(list => list.filter(p => p.id !== id));
      if (this.selectedProjectId() === id) this.selectedProjectId.set(null);
      this._openedIds.update(set => { const next = new Set(set); next.delete(id); return next; });
    }
  }

  reorder(fromIndex: number, toIndex: number): void {
    this._projects.update(list => {
      const next = [...list];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }

  select(id: string): void {
    this.selectedProjectId.set(id);
  }
}
