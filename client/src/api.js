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
  ingestCsv: (content, filename) =>
    request('/api/ingest/csv', { method: 'POST', body: JSON.stringify({ content, filename }) }),
  searchNews: (q) => request(`/api/ingest/news?q=${encodeURIComponent(q)}`),
  searchYoutube: (q) => request(`/api/ingest/youtube-search?q=${encodeURIComponent(q)}`),

  listProjects: () => request('/api/projects'),
  createProject: (title, targetWords) =>
    request('/api/projects', { method: 'POST', body: JSON.stringify({ title, targetWords }) }),
  getProject: (id) => request(`/api/projects/${id}`),
  updateProject: (id, updates) =>
    request(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  getSettings: () => request('/api/settings'),
  saveSettings: (settings) => request('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // starts the stage as a background job, then polls the project until the
  // job finishes; resolves with the final project (throws on stage error)
  runStage: async function (id, stage, onProgress = () => {}) {
    let project = await request(`/api/pipeline/${id}/run/${stage}`, { method: 'POST', body: '{}' });
    while (project.jobs?.[stage]?.status === 'running') {
      await new Promise((r) => setTimeout(r, 4000));
      project = await request(`/api/projects/${id}`);
      onProgress(project);
    }
    const job = project.jobs?.[stage];
    if (job?.status === 'error') throw new Error(job.message || `Stage ${stage} failed`);
    return project;
  },
  updateScriptChecks: (id, body) =>
    request(`/api/pipeline/${id}/checks`, { method: 'POST', body: JSON.stringify(body) }),
  exportUrl: (id, format) => `/api/pipeline/${id}/export?format=${format}`,

  getPrompts: () => request('/api/prompts'),
  savePrompt: (key, content) =>
    request(`/api/prompts/${key}`, { method: 'PUT', body: JSON.stringify({ content }) }),
};
