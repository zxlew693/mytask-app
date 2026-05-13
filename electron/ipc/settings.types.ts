export interface AppSettings {
  loginEnabled: boolean;
  passwordHash: string;
  notesSalt: string;
}

export interface SaveSettingsPayload {
  loginEnabled?: boolean;
  passwordHash?: string;
  notesSalt?: string;
}
