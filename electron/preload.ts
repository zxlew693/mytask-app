import { contextBridge, ipcRenderer } from 'electron';
import { Channels } from './ipc/channels';
import type { CreateProjectPayload, DeleteProjectPayload, RenameProjectPayload } from './ipc/project.types';
import type { CreateTaskPayload, UpdateTaskStatusPayload, UpdateTaskTitlePayload, DeleteTaskPayload } from './ipc/task.types';

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    close: () => ipcRenderer.send(Channels.WINDOW_CLOSE),
    minimize: () => ipcRenderer.send(Channels.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(Channels.WINDOW_MAXIMIZE),
    onMaximizeChange: (cb: (isMaximized: boolean) => void) =>
      ipcRenderer.on(Channels.WINDOW_MAXIMIZE_CHANGED, (_e, val) => cb(val)),
  },
  projects: {
    getAll: () =>
      ipcRenderer.invoke(Channels.PROJECT_GET_ALL),
    create: (payload: CreateProjectPayload) =>
      ipcRenderer.invoke(Channels.PROJECT_CREATE, payload),
    rename: (payload: RenameProjectPayload) =>
      ipcRenderer.invoke(Channels.PROJECT_RENAME, payload),
    delete: (payload: DeleteProjectPayload) =>
      ipcRenderer.invoke(Channels.PROJECT_DELETE, payload),
  },
  tasks: {
    getAll: () =>
      ipcRenderer.invoke(Channels.TASK_GET_ALL),
    create: (payload: CreateTaskPayload) =>
      ipcRenderer.invoke(Channels.TASK_CREATE, payload),
    updateStatus: (payload: UpdateTaskStatusPayload) =>
      ipcRenderer.invoke(Channels.TASK_UPDATE_STATUS, payload),
    updateTitle: (payload: UpdateTaskTitlePayload) =>
      ipcRenderer.invoke(Channels.TASK_UPDATE_TITLE, payload),
    delete: (payload: DeleteTaskPayload) =>
      ipcRenderer.invoke(Channels.TASK_DELETE, payload),
  },
});
