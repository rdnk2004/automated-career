import { useState } from 'react';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchRepos, analyzeRepo, generateReadme, getProfileReadme } from '../api';

export default function Github() {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [readmeModal, setReadmeModal] = useState(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [profileReadme, setProfileReadme] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleFetch = async () => {
    if (!username.trim()) return toast('Enter a GitHub username', 'error');
    setLoading(true);
    try {
      const r = await fetchRepos(username);
      setRepos(r.repos || r || []);
      toast(`Fetched ${(r.repos || r || []).length} repos!`, 'success');
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  const handleAnalyze = async (repo) => {
    const name = repo.full_name || repo.name;
    setAnalyzing(name);
    try {
      const a = await analyzeRepo(name);
      setAnalysis({ repo: name, data: a });
      toast('Repo analyzed!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setAnalyzing(null);
  };

  const handleReadme = async (repo) => {
    const name = repo.full_name || repo.name;
    setReadmeLoading(true);
    try {
      const r = await generateReadme(name);
      setReadmeModal({ repo: name, content: r.readme || r.content || JSON.stringify(r, null, 2) });
      toast('README generated!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setReadmeLoading(false);
  };

  const handleProfileReadme = async () => {
    setProfileLoading(true);
    try {
      const r = await getProfileReadme();
      setProfileReadme(r.readme || r.content || JSON.stringify(r, null, 2));
      toast('Profile README generated!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setProfileLoading(false);
  };

  const classColor = (c) => {
    if (!c) return 'gray';
    const l = c.toLowerCase();
    if (l.includes('flagship') || l.includes('advanced')) return 'purple';
    if (l.includes('intermediate') || l.includes('standard')) return 'blue';
    if (l.includes('beginner') || l.includes('basic')) return 'green';
    return 'gray';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🐙 GitHub Analyzer</h2>
        <p>Fetch repos, classify projects, generate READMEs, and build your profile</p>
      </div>

      <div className="card mb-md">
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>GitHub Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. octocat"
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
            {loading ? '⏳ Fetching...' : '🔍 Fetch Repos'}
          </button>
          <button className="btn btn-secondary" onClick={handleProfileReadme} disabled={profileLoading}>
            {profileLoading ? '⏳' : '👤'} Profile README
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner text="Fetching repositories..." />}

      {profileReadme && (
        <div className="card mb-md">
          <div className="card-header">
            <h3>👤 Profile README</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setProfileReadme(null)}>Close</button>
          </div>
          <div className="markdown-preview">{profileReadme}</div>
        </div>
      )}

      {!loading && repos.length > 0 && (
        <div className="card-grid">
          {repos.map((repo, i) => (
            <div className="card" key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{repo.name}</h4>
                  {repo.language && <span className="badge badge-blue" style={{ marginTop: 4 }}>{repo.language}</span>}
                </div>
                {repo.classification && (
                  <span className={`badge badge-${classColor(repo.classification)}`}>
                    {repo.classification}
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 12 }}>
                {repo.description || 'No description'}
              </p>

              {repo.topics?.length > 0 && (
                <div className="tags" style={{ marginBottom: 12 }}>
                  {repo.topics.slice(0, 5).map((t, j) => <span className="tag" key={j}>{t}</span>)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                <span>⭐ {repo.stargazers_count || 0}</span>
                <span>🍴 {repo.forks_count || 0}</span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAnalyze(repo)}
                  disabled={analyzing === (repo.full_name || repo.name)}
                >
                  {analyzing === (repo.full_name || repo.name) ? '⏳' : '🔬'} Analyze
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleReadme(repo)}
                  disabled={readmeLoading}
                >
                  📝 README
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && repos.length === 0 && (
        <div className="empty-state">
          <div className="icon">🐙</div>
          <p>Enter a GitHub username and click Fetch to get started</p>
        </div>
      )}

      {analysis && (
        <div className="modal-overlay" onClick={() => setAnalysis(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔬 Analysis: {analysis.repo}</h3>
              <button className="modal-close" onClick={() => setAnalysis(null)}>×</button>
            </div>
            <div className="markdown-preview">
              {typeof analysis.data === 'string'
                ? analysis.data
                : JSON.stringify(analysis.data, null, 2)}
            </div>
          </div>
        </div>
      )}

      {readmeModal && (
        <div className="modal-overlay" onClick={() => setReadmeModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Generated README: {readmeModal.repo}</h3>
              <button className="modal-close" onClick={() => setReadmeModal(null)}>×</button>
            </div>
            <div className="markdown-preview">{readmeModal.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}
