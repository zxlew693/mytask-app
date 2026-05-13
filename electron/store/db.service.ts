import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { Project, CreateProjectPayload } from '../ipc/project.types';
import type { Task, CreateTaskPayload, UpdateTaskStatusPayload, UpdateTaskTitlePayload, TaskStatus } from '../ipc/task.types';
import type { NoteRow, NoteListItem } from '../ipc/note.types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const initSqlJs = require('sql.js');

interface SqlJsStmt {
  bind(params: unknown[]): void;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  run(params?: unknown[]): void;
  free(): void;
  reset(): void;
}

interface SqlJsDb {
  run(sql: string, params?: unknown[]): void;
  prepare(sql: string): SqlJsStmt;
  export(): Uint8Array;
  close(): void;
}

export class DbService {
  private db!: SqlJsDb;
  private dbPath: string;
  readonly ready: Promise<void>;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      this.db = new SQL.Database(fs.readFileSync(this.dbPath)) as SqlJsDb;
    } else {
      this.db = new SQL.Database() as SqlJsDb;
    }
    this.db.run('PRAGMA foreign_keys = ON');
    this.initSchema();
    this.persist();
  }

  private initSchema(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        projectId TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('current','completed','cancelled')),
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        cancelledAt TEXT,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Untitled',
        content TEXT NOT NULL DEFAULT '',
        updatedAt TEXT NOT NULL
      )
    `);
    // migration: add title column if it doesn't exist (existing DBs)
    try {
      this.db.run(`ALTER TABLE notes ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled'`);
    } catch {
      // column already exists — ignore
    }
  }

  private persist(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.dbPath, this.db.export());
  }

  private queryAll<T>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject() as T);
    stmt.free();
    return rows;
  }

  private queryOne<T>(sql: string, params: unknown[] = []): T | null {
    const rows = this.queryAll<T>(sql, params);
    return rows[0] ?? null;
  }

  // ---- Projects ----

  getAllProjects(): Project[] {
    return this.queryAll<Project>(
      'SELECT id, name, createdAt FROM projects ORDER BY createdAt ASC'
    );
  }

  createProject(payload: CreateProjectPayload): Project {
    const project: Project = {
      id: randomUUID(),
      name: payload.name.trim(),
      createdAt: new Date().toISOString(),
    };
    const stmt = this.db.prepare('INSERT INTO projects (id, name, createdAt) VALUES (?, ?, ?)');
    stmt.run([project.id, project.name, project.createdAt]);
    stmt.free();
    this.persist();
    return project;
  }

  renameProject(id: string, name: string): Project {
    const trimmed = name.trim();
    const stmt = this.db.prepare('UPDATE projects SET name = ? WHERE id = ?');
    stmt.run([trimmed, id]);
    stmt.free();
    this.persist();
    const row = this.queryOne<Project>('SELECT id, name, createdAt FROM projects WHERE id = ?', [id]);
    if (!row) throw new Error(`Project ${id} not found`);
    return row;
  }

  deleteProject(id: string): void {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    this.persist();
  }

  // ---- Tasks ----

  getAllTasks(): Task[] {
    return this.queryAll<Record<string, unknown>>(
      'SELECT id, title, projectId, status, createdAt, completedAt, cancelledAt FROM tasks ORDER BY createdAt ASC'
    ).map(r => this.rowToTask(r));
  }

  createTask(payload: CreateTaskPayload): Task {
    const task: Task = {
      id: randomUUID(),
      title: payload.title.trim(),
      projectId: payload.projectId,
      status: 'current',
      createdAt: new Date().toISOString(),
      completedAt: null,
      cancelledAt: null,
    };
    const stmt = this.db.prepare(
      'INSERT INTO tasks (id, title, projectId, status, createdAt, completedAt, cancelledAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run([task.id, task.title, task.projectId, task.status, task.createdAt, null, null]);
    stmt.free();
    this.persist();
    return task;
  }

  updateTaskStatus(payload: UpdateTaskStatusPayload): Task {
    const now = new Date().toISOString();
    const completedAt = payload.status === 'completed' ? now : null;
    const cancelledAt = payload.status === 'cancelled' ? now : null;

    const stmt = this.db.prepare(
      'UPDATE tasks SET status = ?, completedAt = ?, cancelledAt = ? WHERE id = ?'
    );
    stmt.run([payload.status, completedAt, cancelledAt, payload.id]);
    stmt.free();
    this.persist();

    const row = this.queryOne<Record<string, unknown>>(
      'SELECT id, title, projectId, status, createdAt, completedAt, cancelledAt FROM tasks WHERE id = ?',
      [payload.id]
    );
    if (!row) throw new Error(`Task ${payload.id} not found`);
    return this.rowToTask(row);
  }

  updateTaskTitle(payload: UpdateTaskTitlePayload): Task {
    const trimmed = payload.title.trim();
    if (!trimmed) throw new Error('Title cannot be empty');
    const stmt = this.db.prepare('UPDATE tasks SET title = ? WHERE id = ?');
    stmt.run([trimmed, payload.id]);
    stmt.free();
    this.persist();
    const row = this.queryOne<Record<string, unknown>>(
      'SELECT id, title, projectId, status, createdAt, completedAt, cancelledAt FROM tasks WHERE id = ?',
      [payload.id]
    );
    if (!row) throw new Error(`Task ${payload.id} not found`);
    return this.rowToTask(row);
  }

  deleteTask(id: string): void {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    this.persist();
  }

  // ---- Notes ----

  listNotes(): NoteListItem[] {
    return this.queryAll<NoteListItem>(
      'SELECT id, title, updatedAt FROM notes ORDER BY updatedAt DESC'
    );
  }

  getNote(id: string): NoteRow | null {
    return this.queryOne<NoteRow>(
      'SELECT id, title, content, updatedAt FROM notes WHERE id = ?',
      [id]
    );
  }

  createNote(title: string): NoteRow {
    const note: NoteRow = {
      id: randomUUID(),
      title: title.trim() || 'Untitled',
      content: '',
      updatedAt: new Date().toISOString(),
    };
    const stmt = this.db.prepare(
      'INSERT INTO notes (id, title, content, updatedAt) VALUES (?, ?, ?, ?)'
    );
    stmt.run([note.id, note.title, note.content, note.updatedAt]);
    stmt.free();
    this.persist();
    return note;
  }

  upsertNote(id: string, content: string): NoteRow {
    const updatedAt = new Date().toISOString();
    const stmt = this.db.prepare(
      `UPDATE notes SET content = ?, updatedAt = ? WHERE id = ?`
    );
    stmt.run([content, updatedAt, id]);
    stmt.free();
    this.persist();
    return this.queryOne<NoteRow>('SELECT id, title, content, updatedAt FROM notes WHERE id = ?', [id])!;
  }

  deleteNote(id: string): void {
    const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    this.persist();
  }

  private rowToTask(row: Record<string, unknown>): Task {
    return {
      id: row['id'] as string,
      title: row['title'] as string,
      projectId: row['projectId'] as string,
      status: row['status'] as TaskStatus,
      createdAt: row['createdAt'] as string,
      completedAt: (row['completedAt'] as string | null) ?? null,
      cancelledAt: (row['cancelledAt'] as string | null) ?? null,
    };
  }
}
