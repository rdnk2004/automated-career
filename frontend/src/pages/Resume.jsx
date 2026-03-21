import { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyzeResume, generateBullets, getResumeHistory } from '../api';

export default function Resume() {
  const toast = useToast();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tab, setTab] = useState('analyze');
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  // Bullet generator
  const [bulletProject, setBulletProject] = useState('');
  const [bulletTech, setBulletTech] = useState('');
  const [bulletRole, setBulletRole] = useState('');
  const [bullets, setBullets] = useState(null);
  const [bulletLoading, setBulletLoading] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') setFile(f);
    else toast('Please drop a PDF file', 'error');
  };

  const handleAnalyze = async () => {
    if (!file) return toast('Upload a resume first', 'error');
    setLoading(true);
    try {
      const r = await analyzeResume(file, jd || undefined);
      setResult(r);
      toast('Resume analyzed!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  const loadHistory = async () => {
    setHistLoading(true);
    try {
      const h = await getResumeHistory();
      setHistory(h);
    } catch { setHistory([]); }
    setHistLoading(false);
  };

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const handleBullets = async () => {
    if (!bulletProject) return toast('Enter a project name', 'error');
    setBulletLoading(true);
    try {
      const b = await generateBullets({
        project_name: bulletProject,
        technologies: bulletTech,
        role: bulletRole,
      });
      setBullets(b);
      toast('Bullets generated!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setBulletLoading(false);
  };

  const scoreColor = (s) => s >= 75 ? 'green' : s >= 50 ? 'yellow' : 'red';

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📄 Resume Analyzer</h2>
        <p>Upload your resume for AI-powered feedback, ATS scoring, and bullet generation</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['analyze', 'bullets', 'history'].map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab(t)}
          >
            {t === 'analyze' ? '🔍 Analyze' : t === 'bullets' ? '✏️ Bullet Generator' : '📋 History'}
          </button>
        ))}
      </div>

      {tab === 'analyze' && (
        <div className="row gap-lg" style={{ alignItems: 'flex-start' }}>
          <div className="col">
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div className="icon">📄</div>
              <p>{file ? `✅ ${file.name}` : 'Drag & drop your resume or click to browse'}</p>
              <p className="hint">PDF files only</p>
              <input
                ref={fileRef} type="file" accept=".pdf" hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <div className="form-group mt-md">
              <label>Job Description (optional)</label>
              <textarea
                className="textarea"
                placeholder="Paste the target JD for tailored analysis..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
              {loading ? '⏳ Analyzing...' : '🚀 Analyze Resume'}
            </button>
          </div>

          <div className="col">
            {loading && <LoadingSpinner text="AI is analyzing your resume..." />}

            {!loading && result && (
              <div className="card">
                <div className="card-header">
                  <h3>Analysis Results</h3>
                  <span className={`badge badge-${scoreColor(result.ats_score || 0)}`}>
                    ATS Score: {result.ats_score || 0}%
                  </span>
                </div>

                {result.ats_score != null && (
                  <div style={{ marginBottom: 18 }}>
                    <div className="score-bar">
                      <div
                        className={`score-bar-fill ${scoreColor(result.ats_score)}`}
                        style={{ width: `${result.ats_score}%` }}
                      />
                    </div>
                  </div>
                )}

                {result.highlights?.map((h, i) => (
                  <div className={`segment ${h.rating}`} key={i}>
                    <div className="segment-header">
                      <span className="segment-label">
                        {h.rating === 'green' ? '✅' : h.rating === 'yellow' ? '⚠️' : '❌'} {h.section || 'General'}
                      </span>
                      <span className="segment-section">{h.rating}</span>
                    </div>
                    <div className="segment-text">{h.text}</div>
                    {h.comment && <div className="segment-comment">{h.comment}</div>}
                    {h.suggestion && <div className="segment-suggestion">💡 {h.suggestion}</div>}
                  </div>
                ))}

                {result.missing_keywords?.length > 0 && (
                  <div className="mt-md">
                    <h4 style={{ fontSize: '0.88rem', marginBottom: 8 }}>Missing Keywords</h4>
                    <div className="tags">
                      {result.missing_keywords.map((k, i) => (
                        <span className="tag" key={i}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !result && (
              <div className="empty-state">
                <div className="icon">📊</div>
                <p>Upload a resume and click Analyze to see results</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'bullets' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>✏️ Bullet Point Generator</h3>
          <div className="form-group">
            <label>Project Name</label>
            <input className="input" value={bulletProject} onChange={(e) => setBulletProject(e.target.value)} placeholder="e.g. E-commerce Platform" />
          </div>
          <div className="form-group">
            <label>Technologies</label>
            <input className="input" value={bulletTech} onChange={(e) => setBulletTech(e.target.value)} placeholder="e.g. React, Node.js, PostgreSQL" />
          </div>
          <div className="form-group">
            <label>Your Role</label>
            <input className="input" value={bulletRole} onChange={(e) => setBulletRole(e.target.value)} placeholder="e.g. Full-stack Developer" />
          </div>
          <button className="btn btn-primary" onClick={handleBullets} disabled={bulletLoading}>
            {bulletLoading ? '⏳ Generating...' : '✨ Generate Bullets'}
          </button>

          {bullets && (
            <div className="mt-lg">
              <h4 style={{ fontSize: '0.88rem', marginBottom: 10 }}>Generated Bullets</h4>
              {(bullets.bullets || [bullets]).flat().map((b, i) => (
                <div className="segment green" key={i}>
                  <div className="segment-text">• {typeof b === 'string' ? b : b.bullet || JSON.stringify(b)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📋 Analysis History</h3>
          {histLoading ? <LoadingSpinner text="Loading history..." /> : (
            history.length === 0 ? (
              <div className="empty-state"><p>No analyses found yet.</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>JD Name</th>
                      <th>Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td>{new Date(h.created_at).toLocaleDateString()}</td>
                        <td>{h.jd_name || '—'}</td>
                        <td><span className="badge badge-blue">{h.module}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
