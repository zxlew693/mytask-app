export type TaskStatus = 'current' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  projectId: string;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface CreateTaskPayload {
  title: string;
  projectId: string;
}

export interface UpdateTaskStatusPayload {
  id: string;
  status: TaskStatus;
}

export interface DeleteTaskPayload {
  id: string;
}

export interface UpdateTaskTitlePayload {
  id: string;
  title: string;
}

export interface GetTasksByProjectPayload {
  projectId: string;
}
