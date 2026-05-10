import { ipcMain } from 'electron';
import { Channels } from './channels';
import type { DbService } from '../store/db.service';
import type { IpcEnvelope } from './project.types';
import type { Task, CreateTaskPayload, UpdateTaskStatusPayload, DeleteTaskPayload } from './task.types';

export function registerTaskHandlers(db: DbService): void {
  ipcMain.handle(Channels.TASK_GET_ALL, (): IpcEnvelope<Task[]> => {
    try {
      return { success: true, data: db.getAllTasks() };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(Channels.TASK_CREATE, (_e, payload: CreateTaskPayload): IpcEnvelope<Task> => {
    try {
      return { success: true, data: db.createTask(payload) };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(Channels.TASK_UPDATE_STATUS, (_e, payload: UpdateTaskStatusPayload): IpcEnvelope<Task> => {
    try {
      return { success: true, data: db.updateTaskStatus(payload) };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(Channels.TASK_DELETE, (_e, payload: DeleteTaskPayload): IpcEnvelope => {
    try {
      db.deleteTask(payload.id);
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });
}
