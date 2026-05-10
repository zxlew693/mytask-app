import type { Project, CreateProjectPayload, DeleteProjectPayload, RenameProjectPayload, IpcEnvelope } from '../electron/ipc/project.types';
import type { Task, CreateTaskPayload, UpdateTaskStatusPayload, DeleteTaskPayload } from '../electron/ipc/task.types';

interface ElectronAPI {
  window: {
    close(): void;
    maximize(): void;
    onMaximizeChange(cb: (isMaximized: boolean) => void): void;
  };
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
