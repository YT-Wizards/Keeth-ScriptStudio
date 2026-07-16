async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
}

export const api = {
  health: () => request('/api/health'),

  ingestYoutube: (url) => request('/api/ingest/youtube', { method: 'POST', body: JSON.stringify({ url }) }),
  ingestReddit: (url) => request('/api/ingest/reddit', { method: 'POST', body: JSON.stringify({ url }) }),
  searchNews: (q) => request(`/api/ingest/news?q=${encodeURIComponent(q)}`),

  listProjects: () => request('/api/projects'),
  createProject: (title, targetWords) =>
    request('/api/projects', { method: 'POST', body: JSON.stringify({ title, targetWords }) }),
  getProject: (id) => request(`/api/projects/${id}`),
  updateProject: (id, updates) =>
    request(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  getSettings: () => request('/api/settings'),
  saveSettings: (settings) => request('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  runStage: (id, stage) => request(`/api/pipeline/${id}/${stage}`, { method: 'POST', body: '{}' }),
  updateScriptChecks: (id, body) =>
    request(`/api/pipeline/${id}/checks`, { method: 'POST', body: JSON.stringify(body) }),
  exportUrl: (id, format) => `/api/pipeline/${id}/export?format=${format}`,

  getPrompts: () => request('/api/prompts'),
  savePrompt: (key, content) =>
    request(`/api/prompts/${key}`, { method: 'PUT', body: JSON.stringify({ content }) }),
};
