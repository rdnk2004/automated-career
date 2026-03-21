import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboard, getSuggestions, updateSuggestion, generateSuggestions } from '../api';

const CIRC = 2 * Math.PI * 72;

function HealthGauge({ score }) {
  const offset = CIRC - (score / 100) * CIRC;
  return (
    <div className="health-gauge">
      <svg viewBox="0 0 180 180">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle className="gauge-bg" cx="90" cy="90" r="72" />
        <circle
          className="gauge-fill"
          cx="90" cy="90" r="72"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-label">
        <span className="gauge-value">{score}</span>
        <span className="gauge-text">Health Score</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    Promise.all([getDashboard(), getSuggestions()])
      .then(([d, s]) => { setData(d); setSuggestions(s); })
      .catch(() => {
        setData({ health_score: 0, stats: { skills: 0, projects: 0, hr_contacts: 0, job_listings: 0, suggestions_pending: 0 } });
        setSuggestions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSuggestion = async (id, status) => {
    try {
      await updateSuggestion(id, { status });
      setSuggestions((p) => p.filter((s) => s.id !== id));
      toast(`Suggestion ${status}`, 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleGenerate = async () => {
    setGenLoading(true);
    try {
      const s = await generateSuggestions();
      setSuggestions(s);
      toast('Suggestions generated!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setGenLoading(false);
  };

  if (loading) return <LoadingSpinner text="Initializing dashboard..." />;

  const stats = data?.stats || {};

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Your career intelligence at a glance</p>
      </div>

      <div className="row gap-lg" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '0 0 220px', textAlign: 'center' }}>
          <HealthGauge score={data?.health_score || 0} />
        </div>

        <div style={{ flex: 1 }}>
          <div className="card-grid-3">
            {[
              { label: 'Skills Tracked', value: stats.skills ?? 0, icon: '🛠️' },
              { label: 'Projects', value: stats.projects ?? 0, icon: '📦' },
              { label: 'HR Contacts', value: stats.hr_contacts ?? 0, icon: '🤝' },
              { label: 'Job Listings', value: stats.job_listings ?? 0, icon: '🎯' },
              { label: 'Pending Suggestions', value: stats.suggestions_pending ?? 0, icon: '💡' },
              { label: 'Analyses Run', value: stats.analyses ?? 0, icon: '🔬' },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <span className="stat-label">{s.icon} {s.label}</span>
                <span className="stat-value">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section mt-lg">
        <div className="card">
          <div className="card-header">
            <h3>💡 Cross-Channel Suggestions</h3>
            <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={genLoading}>
              {genLoading ? '⏳ Generating...' : '✨ Generate'}
            </button>
          </div>

          {suggestions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💡</div>
              <p>No pending suggestions. Click Generate to analyze your profiles.</p>
            </div>
          ) : (
            suggestions.map((s) => (
              <div className="suggestion-item" key={s.id}>
                <div className="suggestion-text">
                  <span className="suggestion-type">{s.suggestion_type}</span>
                  {s.suggestion_text}
                  {s.draft_content && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {s.draft_content}
                    </div>
                  )}
                </div>
                <div className="suggestion-actions">
                  <button className="btn btn-success btn-sm" onClick={() => handleSuggestion(s.id, 'accepted')}>
                    ✓ Accept
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleSuggestion(s.id, 'dismissed')}>
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
