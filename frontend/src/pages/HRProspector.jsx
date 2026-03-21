import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { searchHR, getAllHR, generateMessage, updateHRStatus } from '../api';

const STATUS_COLORS = {
  new: 'blue',
  contacted: 'yellow',
  replied: 'green',
  ignored: 'gray',
  connected: 'purple',
};

export default function HRProspector() {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [messageModal, setMessageModal] = useState(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [msgTone, setMsgTone] = useState('professional');

  useEffect(() => {
    getAllHR()
      .then((r) => setContacts(r.contacts || r || []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!company && !role) return toast('Enter company or role', 'error');
    setSearchLoading(true);
    try {
      const r = await searchHR({ company, role, location });
      const newContacts = r.contacts || r || [];
      setContacts((prev) => [...newContacts, ...prev]);
      toast(`Found ${newContacts.length} contacts!`, 'success');
    } catch (e) { toast(e.message, 'error'); }
    setSearchLoading(false);
  };

  const handleGenerateMsg = async (contact) => {
    setMessageModal(contact);
    setMsgLoading(true);
    try {
      const r = await generateMessage(contact.id, { tone: msgTone });
      setGeneratedMsg(r.message || r.content || JSON.stringify(r));
    } catch (e) {
      setGeneratedMsg('');
      toast(e.message, 'error');
    }
    setMsgLoading(false);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateHRStatus(id, { status });
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      toast(`Status updated to ${status}`, 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading) return <LoadingSpinner text="Loading contacts..." />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🤝 HR Prospector</h2>
        <p>Find hiring managers, generate outreach messages, and track your pipeline</p>
      </div>

      <div className="card mb-md">
        <h3 style={{ marginBottom: 14 }}>🔍 Search Contacts</h3>
        <div className="row gap-md" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
            <label>Company</label>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
            <label>Role Title</label>
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Engineering Manager" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
            <label>Location</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. San Francisco" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? '⏳ Searching...' : '🔍 Search'}
            </button>
          </div>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🤝</div>
          <p>No contacts yet. Search to find hiring managers and recruiters.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Contact Pipeline ({contacts.length})</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {c.name}
                      {c.linkedin_url && (
                        <a href={c.linkedin_url} target="_blank" rel="noreferrer" style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--accent-blue)' }}>
                          🔗
                        </a>
                      )}
                    </td>
                    <td>{c.title || '—'}</td>
                    <td>{c.company || '—'}</td>
                    <td>
                      <select
                        className="input"
                        style={{ padding: '4px 8px', width: 'auto', fontSize: '0.78rem' }}
                        value={c.status || 'new'}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      >
                        {Object.keys(STATUS_COLORS).map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleGenerateMsg(c)}>
                        ✉️ Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {messageModal && (
        <div className="modal-overlay" onClick={() => setMessageModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✉️ Message for {messageModal.name}</h3>
              <button className="modal-close" onClick={() => setMessageModal(null)}>×</button>
            </div>

            <div className="form-group">
              <label>Tone</label>
              <select className="input" value={msgTone} onChange={(e) => setMsgTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <button className="btn btn-primary btn-sm mb-md" onClick={() => handleGenerateMsg(messageModal)} disabled={msgLoading}>
              {msgLoading ? '⏳' : '🔄'} Regenerate
            </button>

            {msgLoading ? (
              <LoadingSpinner text="Generating message..." />
            ) : generatedMsg ? (
              <div className="markdown-preview">{generatedMsg}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
