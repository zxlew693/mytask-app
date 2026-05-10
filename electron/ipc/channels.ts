export const Channels = {
  PROJECT_GET_ALL:     'project:getAll',
  PROJECT_CREATE:      'project:create',
  PROJECT_DELETE:      'project:delete',
  PROJECT_RENAME:      'project:rename',
  TASK_GET_ALL:        'task:getAll',
  TASK_GET_BY_PROJECT: 'task:getByProject',
  TASK_CREATE:         'task:create',
  TASK_UPDATE_STATUS:  'task:updateStatus',
  TASK_DELETE:         'task:delete',
  WINDOW_CLOSE:        'window:close',
  WINDOW_MAXIMIZE:     'window:maximize',
  WINDOW_MAXIMIZE_CHANGED: 'window:maximizeChanged',
} as const;

export type ChannelName = typeof Channels[keyof typeof Channels];
