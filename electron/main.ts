import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { DbService } from './store/db.service';
import { registerProjectHandlers } from './ipc/project.ipc';
import { registerTaskHandlers } from './ipc/task.ipc';
import { Channels } from './ipc/channels';

const isDev = process.env['NODE_ENV'] === 'development';

function createWindow(): void {
  const iconPath = path.join(__dirname, '../public/favicon.ico');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/todo-app/browser/index.html'));
  }
}

app.whenReady().then(async () => {
  const dbPath = path.join(app.getPath('userData'), 'mytask.db');
  const db = new DbService(dbPath);
  await db.ready;

  registerProjectHandlers(db);
  registerTaskHandlers(db);

  ipcMain.on(Channels.WINDOW_CLOSE, () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

  ipcMain.on(Channels.WINDOW_MAXIMIZE, () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });

  app.on('browser-window-created', (_, win) => {
    win.on('maximize', () => win.webContents.send(Channels.WINDOW_MAXIMIZE_CHANGED, true));
    win.on('unmaximize', () => win.webContents.send(Channels.WINDOW_MAXIMIZE_CHANGED, false));
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
