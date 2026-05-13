import { ipcMain } from 'electron';
import { Channels } from './channels';
import type { SaveSettingsPayload } from './settings.types';
import type { SettingsService } from '../store/settings.service';

export function registerSettingsHandlers(settingsService: SettingsService): void {
  ipcMain.handle(Channels.SETTINGS_GET, () => {
    return settingsService.getSettings();
  });

  ipcMain.handle(Channels.SETTINGS_SAVE, (_event, payload: SaveSettingsPayload) => {
    return settingsService.saveSettings(payload);
  });
}
