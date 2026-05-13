import { inject, Injectable, signal } from '@angular/core';
import { ELECTRON_API, type NoteListItem } from '../../shared/electron-api.token';
import { NotesCryptoService } from './notes-crypto.service';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private api = inject(ELECTRON_API);
  private crypto = inject(NotesCryptoService);

  private _notes = signal<NoteListItem[]>([]);
  private _selectedNoteId = signal<string | null>(null);
  private _editorContent = signal<string>('');
  readonly sidebarTab = signal<'projects' | 'notes'>('projects');

  readonly notes = this._notes.asReadonly();
  readonly selectedNoteId = this._selectedNoteId.asReadonly();
  readonly editorContent = this._editorContent.asReadonly();

  async loadAll(): Promise<void> {
    const items = await this.api.notes.list();
    this._notes.set(items);
  }

  async create(title: string): Promise<NoteListItem> {
    const note = await this.api.notes.create({ title });
    this._notes.update(list => [{ id: note.id, title: note.title, updatedAt: note.updatedAt }, ...list]);
    return note;
  }

  async selectNote(id: string): Promise<void> {
    this._selectedNoteId.set(id);
    this._editorContent.set('');
    const row = await this.api.notes.get(id);
    if (row?.content) {
      try {
        this._editorContent.set(await this.crypto.decrypt(row.content));
      } catch {
        this._editorContent.set('');
      }
    }
  }

  async save(html: string): Promise<void> {
    const id = this._selectedNoteId();
    if (!id) return;
    const blob = await this.crypto.encrypt(html);
    const updated = await this.api.notes.upsert({ id, content: blob });
    this._editorContent.set(html);
    this._notes.update(list =>
      list.map(n => n.id === id ? { ...n, updatedAt: updated.updatedAt } : n)
    );
  }

  async delete(id: string): Promise<void> {
    await this.api.notes.delete({ id });
    this._notes.update(list => list.filter(n => n.id !== id));
    if (this._selectedNoteId() === id) {
      this._selectedNoteId.set(null);
      this._editorContent.set('');
    }
  }

  reset(): void {
    this._notes.set([]);
    this._selectedNoteId.set(null);
    this._editorContent.set('');
  }
}
