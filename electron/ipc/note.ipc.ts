import { ipcMain } from 'electron';
import { Channels } from './channels';
import type { CreateNotePayload, UpsertNotePayload, DeleteNotePayload } from './note.types';
import type { DbService } from '../store/db.service';

export function registerNoteHandlers(db: DbService): void {
  ipcMain.handle(Channels.NOTE_LIST, () => {
    return db.listNotes();
  });

  ipcMain.handle(Channels.NOTE_GET, (_event, id: string) => {
    return db.getNote(id);
  });

  ipcMain.handle(Channels.NOTE_CREATE, (_event, payload: CreateNotePayload) => {
    return db.createNote(payload.title);
  });

  ipcMain.handle(Channels.NOTE_UPSERT, (_event, payload: UpsertNotePayload) => {
    return db.upsertNote(payload.id, payload.content);
  });

  ipcMain.handle(Channels.NOTE_DELETE, (_event, payload: DeleteNotePayload) => {
    return db.deleteNote(payload.id);
  });
}
