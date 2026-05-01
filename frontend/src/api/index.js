import api from './axios';
export const chatAPI = {
  getMessages: (projectId) => api.get(`/chat/${projectId}`),
  send: (projectId, text) => api.post(`/chat/${projectId}`, { text }),
};

export default api;

export const publicAPI = {
  getStats: () => api.get('/public/stats'),
};

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getAllUsers: () => api.get('/auth/users'),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, userId) => api.post(`/projects/${id}/add-member`, { userId }),
  removeMember: (id, userId) => api.post(`/projects/${id}/remove-member`, { userId }),
};

export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (tasks) => api.post('/tasks/reorder', { tasks }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

export const analyticsAPI = {
  getVelocity: () => api.get('/analytics/velocity'),
  getHeatmap: () => api.get('/analytics/heatmap'),
  getLeaderboard: () => api.get('/analytics/leaderboard'),
};

export const commentsAPI = {
  getAll: (taskId) => api.get(`/comments/task/${taskId}`),
  add: (taskId, text) => api.post('/comments', { taskId, text }),
};

export const subtasksAPI = {
  getAll: (taskId) => api.get(`/tasks/${taskId}/subtasks`),
  add: (taskId, title) => api.post(`/tasks/${taskId}/subtasks`, { title }),
  toggle: (taskId, subtaskId) => api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`),
  delete: (taskId, subtaskId) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.post('/notifications/read-all'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  dismiss: (id) => api.delete(`/notifications/${id}`),
};

export const activityAPI = {
  getAll: (params) => api.get('/activity', { params }),
};

export const searchAPI = {
  search: (q) => api.get('/search', { params: { q } }),
};

export const sprintsAPI = {
  getAll: (projectId) => api.get('/sprints', { params: { projectId } }),
  create: (data) => api.post('/sprints', data),
};
