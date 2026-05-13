import * as fs from 'fs';
import type { AppSettings } from '../ipc/settings.types';

const DEFAULTS: AppSettings = {
  loginEnabled: false,
  passwordHash: '',
  notesSalt: '',
};

export class SettingsService {
  private filePath: string;
  private data: AppSettings;

  constructor(filePath: string) {
    this.filePath = filePath;
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        this.data = { ...DEFAULTS, ...JSON.parse(raw) };
      } catch {
        this.data = { ...DEFAULTS };
      }
    } else {
      this.data = { ...DEFAULTS };
    }
  }

  getSettings(): AppSettings {
    return { ...this.data };
  }

  saveSettings(patch: Partial<AppSettings>): AppSettings {
    this.data = { ...this.data, ...patch };
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    return { ...this.data };
  }
}
