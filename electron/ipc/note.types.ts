export interface NoteRow {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface NoteListItem {
  id: string;
  title: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title: string;
}

export interface UpsertNotePayload {
  id: string;
  content: string;
}

export interface DeleteNotePayload {
  id: string;
}

export interface RenameNotePayload {
  id: string;
  title: string;
}
