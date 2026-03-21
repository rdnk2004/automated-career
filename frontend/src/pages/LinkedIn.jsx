import { useState } from 'react';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { scrapeLinkedIn, analyzeLinkedIn, getLinkedInPosts } from '../api';

export default function LinkedIn() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [jd, setJd] = useState('');
  const [posts, setPosts] = useState(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [tab, setTab] = useState('scrape');

  const handleScrape = async () => {
    setScraping(true);
    try {
      const r = await scrapeLinkedIn();
      setProfile(r);
      toast('Profile scraped!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setScraping(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const r = await analyzeLinkedIn({ jd: jd || undefined });
      setAnalysis(r);
      toast('Profile analyzed!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setAnalyzing(false);
  };

  const handlePosts = async () => {
    setPostsLoading(true);
    try {
      const r = await getLinkedInPosts();
      setPosts(r);
      toast('Post ideas generated!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setPostsLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>💼 LinkedIn Optimizer</h2>
        <p>Scrape, analyze, and optimize your LinkedIn profile with AI</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['scrape', 'analyze', 'posts'].map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab(t)}
          >
            {t === 'scrape' ? '🔗 Scrape Profile' : t === 'analyze' ? '🔍 Analyze' : '📝 Post Ideas'}
          </button>
        ))}
      </div>

      {tab === 'scrape' && (
        <div>
          <div className="card mb-md">
            <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Uses credentials from Settings to scrape your LinkedIn profile data.
            </p>
            <button className="btn btn-primary" onClick={handleScrape} disabled={scraping}>
              {scraping ? '⏳ Scraping...' : '🔗 Scrape My Profile'}
            </button>
          </div>

          {scraping && <LoadingSpinner text="Scraping LinkedIn..." />}

          {profile && !scraping && (
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Scraped Profile Data</h3>
              <div className="markdown-preview">
                {typeof profile === 'string' ? profile : JSON.stringify(profile, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'analyze' && (
        <div className="row gap-lg" style={{ alignItems: 'flex-start' }}>
          <div className="col">
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>🔍 Analyze Profile</h3>
              <div className="form-group">
                <label>Target Job Description (optional)</label>
                <textarea
                  className="textarea"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste a target JD for tailored suggestions..."
                />
              </div>
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? '⏳ Analyzing...' : '🚀 Analyze Profile'}
              </button>
            </div>
          </div>

          <div className="col">
            {analyzing && <LoadingSpinner text="AI is analyzing your profile..." />}
            {analysis && !analyzing && (
              <div className="card">
                <h3 style={{ marginBottom: 16 }}>Analysis Results</h3>

                {analysis.section_rewrites && (
                  <div className="section">
                    <h4 style={{ fontSize: '0.88rem', marginBottom: 10 }}>Section Rewrites</h4>
                    {Object.entries(analysis.section_rewrites || {}).map(([section, rewrite]) => (
                      <div className="segment green" key={section}>
                        <div className="segment-header">
                          <span className="segment-label">{section}</span>
                        </div>
                        <div className="segment-text">{rewrite}</div>
                      </div>
                    ))}
                  </div>
                )}

                {analysis.headline_suggestions && (
                  <div className="section">
                    <h4 style={{ fontSize: '0.88rem', marginBottom: 10 }}>Headline Suggestions</h4>
                    {(Array.isArray(analysis.headline_suggestions) ? analysis.headline_suggestions : [analysis.headline_suggestions]).map((h, i) => (
                      <div className="segment green" key={i}>
                        <div className="segment-text">{typeof h === 'string' ? h : JSON.stringify(h)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {!analysis.section_rewrites && !analysis.headline_suggestions && (
                  <div className="markdown-preview">
                    {JSON.stringify(analysis, null, 2)}
                  </div>
                )}
              </div>
            )}

            {!analyzing && !analysis && (
              <div className="empty-state">
                <div className="icon">📊</div>
                <p>Click Analyze to get AI-powered improvement suggestions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'posts' && (
        <div>
          <div className="card mb-md">
            <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Generate LinkedIn post ideas based on your profile and skills.
            </p>
            <button className="btn btn-primary" onClick={handlePosts} disabled={postsLoading}>
              {postsLoading ? '⏳ Generating...' : '✨ Generate Post Ideas'}
            </button>
          </div>

          {postsLoading && <LoadingSpinner text="Generating post ideas..." />}

          {posts && !postsLoading && (
            <div className="card-grid">
              {(Array.isArray(posts) ? posts : posts.posts || [posts]).map((p, i) => (
                <div className="card" key={i}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 8 }}>
                    {typeof p === 'string' ? `Post Idea ${i + 1}` : p.title || `Post ${i + 1}`}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {typeof p === 'string' ? p : p.content || p.idea || JSON.stringify(p)}
                  </p>
                  {p.hashtags && (
                    <div className="tags mt-sm">
                      {p.hashtags.map((h, j) => <span className="tag" key={j}>#{h}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
