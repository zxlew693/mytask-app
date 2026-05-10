export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreateProjectPayload {
  name: string;
}

export interface DeleteProjectPayload {
  id: string;
}

export interface RenameProjectPayload {
  id: string;
  name: string;
}

export interface IpcEnvelope<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
