import { InjectionToken } from '@angular/core';
import type { IpcEnvelope, Project, CreateProjectPayload, DeleteProjectPayload, RenameProjectPayload } from '../../../electron/ipc/project.types';
import type { Task, CreateTaskPayload, UpdateTaskStatusPayload, DeleteTaskPayload } from '../../../electron/ipc/task.types';

export type { IpcEnvelope };

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
    delete(payload: DeleteTaskPayload): Promise<IpcEnvelope<void>>;
  };
}

export const ELECTRON_API = new InjectionToken<ElectronApi>('window.electronAPI', {
  providedIn: 'root',
  factory: () => (window as Window & { electronAPI?: ElectronApi }).electronAPI!,
});
