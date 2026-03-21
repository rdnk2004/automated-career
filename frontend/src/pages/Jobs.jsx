import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { getJobs, scrapeJobs, tailorResume } from '../api';

export default function Jobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [scrapeLocation, setScrapeLocation] = useState('');
  const [tailoring, setTailoring] = useState(null);
  const [tailorResult, setTailorResult] = useState(null);

  useEffect(() => {
    getJobs()
      .then((r) => setJobs(r.jobs || r || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleScrape = async () => {
    if (!query) return toast('Enter a job query', 'error');
    setScrapeLoading(true);
    try {
      const r = await scrapeJobs({ query, location: scrapeLocation });
      const newJobs = r.jobs || r || [];
      setJobs((prev) => [...newJobs, ...prev]);
      toast(`Scraped ${newJobs.length} jobs!`, 'success');
    } catch (e) { toast(e.message, 'error'); }
    setScrapeLoading(false);
  };

  const handleTailor = async (job) => {
    setTailoring(job.id);
    try {
      const r = await tailorResume(job.id);
      setTailorResult({ job, data: r });
      toast('Resume tailored!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setTailoring(null);
  };

  const matchColor = (score) => {
    if (score == null) return 'gray';
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  if (loading) return <LoadingSpinner text="Loading job listings..." />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🎯 Job Feed</h2>
        <p>Scrape job listings, match with your profile, and tailor your resume</p>
      </div>

      <div className="card mb-md">
        <h3 style={{ marginBottom: 14 }}>🔍 Scrape Jobs</h3>
        <div className="row gap-md" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
            <label>Search Query</label>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Full Stack Developer" onKeyDown={(e) => e.key === 'Enter' && handleScrape()} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
            <label>Location</label>
            <input className="input" value={scrapeLocation} onChange={(e) => setScrapeLocation(e.target.value)} placeholder="e.g. Remote" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleScrape} disabled={scrapeLoading}>
              {scrapeLoading ? '⏳ Scraping...' : '🕸️ Scrape'}
            </button>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎯</div>
          <p>No jobs found. Try scraping with a search query above.</p>
        </div>
      ) : (
        <div className="card-grid">
          {jobs.map((job, i) => (
            <div className="card" key={job.id || i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{job.title}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--accent-blue)' }}>
                    {job.company} {job.location ? `• ${job.location}` : ''}
                  </p>
                </div>
                {job.match_score != null && (
                  <span className={`badge badge-${matchColor(job.match_score)}`}>
                    {job.match_score}% match
                  </span>
                )}
              </div>

              {job.salary && (
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-green)', marginBottom: 6 }}>
                  💰 {job.salary}
                </p>
              )}

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description || 'No description available'}
              </p>

              {job.skills?.length > 0 && (
                <div className="tags" style={{ marginBottom: 12 }}>
                  {job.skills.slice(0, 5).map((s, j) => <span className="tag" key={j}>{s}</span>)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleTailor(job)}
                  disabled={tailoring === job.id}
                >
                  {tailoring === job.id ? '⏳' : '📄'} Tailor Resume
                </button>
                {job.url && (
                  <a href={job.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                    🔗 Apply
                  </a>
                )}
              </div>

              {job.posted_at && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Posted: {new Date(job.posted_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {tailorResult && (
        <div className="modal-overlay" onClick={() => setTailorResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Tailored Resume for: {tailorResult.job.title}</h3>
              <button className="modal-close" onClick={() => setTailorResult(null)}>×</button>
            </div>
            <div className="markdown-preview">
              {typeof tailorResult.data === 'string'
                ? tailorResult.data
                : tailorResult.data.tailored_resume || tailorResult.data.content || JSON.stringify(tailorResult.data, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
