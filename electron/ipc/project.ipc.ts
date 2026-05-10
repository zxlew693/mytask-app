import { ipcMain } from 'electron';
import { Channels } from './channels';
import type { DbService } from '../store/db.service';
import type { CreateProjectPayload, DeleteProjectPayload, RenameProjectPayload, IpcEnvelope, Project } from './project.types';

export function registerProjectHandlers(db: DbService): void {
  ipcMain.handle(Channels.PROJECT_GET_ALL, (): IpcEnvelope<Project[]> => {
    try {
      return { success: true, data: db.getAllProjects() };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(Channels.PROJECT_CREATE, (_e, payload: CreateProjectPayload): IpcEnvelope<Project> => {
    try {
      return { success: true, data: db.createProject(payload) };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(Channels.PROJECT_RENAME, (_e, payload: RenameProjectPayload): IpcEnvelope<Project> => {
    try {
      return { success: true, data: db.renameProject(payload.id, payload.name) };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle(Channels.PROJECT_DELETE, (_e, payload: DeleteProjectPayload): IpcEnvelope => {
    try {
      db.deleteProject(payload.id);
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });
}
