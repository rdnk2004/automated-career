import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSettings, saveSettings } from '../api';

export default function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    gemini_api_key: '',
    github_token: '',
    linkedin_email: '',
    linkedin_password: '',
    target_role: '',
    target_companies: '',
    skills: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({});

  useEffect(() => {
    getSettings()
      .then((r) => setSettings((prev) => ({ ...prev, ...r })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      toast('Settings saved!', 'success');
    } catch (e) { toast(e.message, 'error'); }
    setSaving(false);
  };

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleKey = (key) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  const sections = [
    {
      title: '🔑 API Keys',
      fields: [
        { key: 'gemini_api_key', label: 'Gemini API Key', type: 'password', placeholder: 'AIza...' },
        { key: 'github_token', label: 'GitHub Token', type: 'password', placeholder: 'ghp_...' },
      ],
    },
    {
      title: '💼 LinkedIn Credentials',
      fields: [
        { key: 'linkedin_email', label: 'Email', type: 'text', placeholder: 'your@email.com' },
        { key: 'linkedin_password', label: 'Password', type: 'password', placeholder: '••••••••' },
      ],
    },
    {
      title: '🎯 Career Preferences',
      fields: [
        { key: 'target_role', label: 'Target Role', type: 'text', placeholder: 'e.g. Senior Software Engineer' },
        { key: 'target_companies', label: 'Target Companies', type: 'text', placeholder: 'e.g. Google, Meta, Amazon' },
        { key: 'skills', label: 'Skills', type: 'text', placeholder: 'e.g. Python, React, AWS, Machine Learning' },
      ],
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>⚙️ Settings</h2>
        <p>Configure API keys, credentials, and career preferences</p>
      </div>

      {sections.map((section) => (
        <div className="card mb-md" key={section.title}>
          <h3 style={{ marginBottom: 18, fontSize: '1rem' }}>{section.title}</h3>
          {section.fields.map((field) => (
            <div className="form-group" key={field.key}>
              <label>{field.label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={field.type === 'password' && !showKeys[field.key] ? 'password' : 'text'}
                  value={settings[field.key] || ''}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => toggleKey(field.key)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {showKeys[field.key] ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
        {saving ? '⏳ Saving...' : '💾 Save Settings'}
      </button>
    </div>
  );
}
