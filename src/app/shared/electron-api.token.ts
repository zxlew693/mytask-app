import { InjectionToken } from '@angular/core';
import type { IpcEnvelope, Project, CreateProjectPayload, DeleteProjectPayload, RenameProjectPayload } from '../../../electron/ipc/project.types';
import type { Task, CreateTaskPayload, UpdateTaskStatusPayload, UpdateTaskTitlePayload, DeleteTaskPayload } from '../../../electron/ipc/task.types';
import type { AppSettings, SaveSettingsPayload } from '../../../electron/ipc/settings.types';
import type { NoteRow, NoteListItem, CreateNotePayload, UpsertNotePayload, DeleteNotePayload } from '../../../electron/ipc/note.types';

export type { IpcEnvelope };
export type { AppSettings, SaveSettingsPayload };
export type { NoteRow, NoteListItem, CreateNotePayload, UpsertNotePayload, DeleteNotePayload };

export interface ElectronApi {
  projects: {
    getAll(): Promise<IpcEnvelope<Project[]>>;
    create(payload: CreateProjectPayload): Promise<IpcEnvelope<Project>>;
    rename(payload: RenameProjectPayload): Promise<IpcEnvelope<Project>>;
    delete(payload: DeleteProjectPayload): Promise<IpcEnvelope<void>>;
  };
  tasks: {
    getAll(): Promise<IpcEnvelope<Task[]>>;
    create(payload: CreateTaskPayload): Promise<IpcEnvelope<Task>>;
    updateStatus(payload: UpdateTaskStatusPayload): Promise<IpcEnvelope<Task>>;
    updateTitle(payload: UpdateTaskTitlePayload): Promise<IpcEnvelope<Task>>;
    delete(payload: DeleteTaskPayload): Promise<IpcEnvelope<void>>;
  };
  settings: {
    get(): Promise<AppSettings>;
    save(payload: SaveSettingsPayload): Promise<AppSettings>;
  };
  notes: {
    list(): Promise<NoteListItem[]>;
    get(id: string): Promise<NoteRow | null>;
    create(payload: CreateNotePayload): Promise<NoteRow>;
    upsert(payload: UpsertNotePayload): Promise<NoteRow>;
    delete(payload: DeleteNotePayload): Promise<void>;
  };
}

export const ELECTRON_API = new InjectionToken<ElectronApi>('window.electronAPI', {
  providedIn: 'root',
  factory: () => (window as Window & { electronAPI?: ElectronApi }).electronAPI!,
});
