const BASE = 'http://localhost:8000';

async function request(url, opts = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

function upload(url, formData) {
  return fetch(`${BASE}${url}`, { method: 'POST', body: formData })
    .then(async (r) => {
      if (!r.ok) {
        const e = await r.json().catch(() => ({ detail: r.statusText }));
        throw new Error(e.detail || 'Upload failed');
      }
      return r.json();
    });
}

// ── Dashboard
export const getDashboard = () => request('/api/dashboard');

// ── Resume
export const analyzeResume = (file, jd) => {
  const fd = new FormData();
  fd.append('file', file);
  if (jd) fd.append('jd', jd);
  return upload('/api/resume/analyze', fd);
};
export const generateBullets = (body) =>
  request('/api/resume/bullets', { method: 'POST', body: JSON.stringify(body) });
export const getResumeHistory = () => request('/api/resume/history');

// ── GitHub
export const fetchRepos = (username) =>
  request('/api/github/fetch', { method: 'POST', body: JSON.stringify({ username }) });
export const analyzeRepo = (repo) =>
  request(`/api/github/analyze/${encodeURIComponent(repo)}`, { method: 'POST' });
export const generateReadme = (repo) =>
  request(`/api/github/readme/${encodeURIComponent(repo)}`, { method: 'POST' });
export const getProfileReadme = () =>
  request('/api/github/profile-readme', { method: 'GET' });

// ── LinkedIn
export const scrapeLinkedIn = () =>
  request('/api/linkedin/scrape', { method: 'POST' });
export const analyzeLinkedIn = (body) =>
  request('/api/linkedin/analyze', { method: 'POST', body: JSON.stringify(body) });
export const getLinkedInPosts = () => request('/api/linkedin/posts');

// ── HR Prospector
export const searchHR = (body) =>
  request('/api/hr/search', { method: 'POST', body: JSON.stringify(body) });
export const getAllHR = () => request('/api/hr/all');
export const generateMessage = (id, body) =>
  request(`/api/hr/${id}/message`, { method: 'POST', body: JSON.stringify(body) });
export const updateHRStatus = (id, body) =>
  request(`/api/hr/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) });

// ── Jobs
export const getJobs = () => request('/api/jobs');
export const scrapeJobs = (body) =>
  request('/api/jobs/scrape', { method: 'POST', body: JSON.stringify(body) });
export const tailorResume = (id) =>
  request(`/api/jobs/${id}/tailor`, { method: 'POST' });

// ── Cross-Channel Sync
export const getSuggestions = () => request('/api/sync/suggestions');
export const generateSuggestions = () =>
  request('/api/sync/generate', { method: 'POST' });
export const updateSuggestion = (id, body) =>
  request(`/api/sync/suggestion/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

// ── Settings
export const getSettings = () => request('/api/settings');
export const saveSettings = (body) =>
  request('/api/settings', { method: 'POST', body: JSON.stringify(body) });
