import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/resume', icon: '📄', label: 'Resume Analyzer' },
  { to: '/github', icon: '🐙', label: 'GitHub Analyzer' },
  { to: '/linkedin', icon: '💼', label: 'LinkedIn Optimizer' },
  { to: '/hr', icon: '🤝', label: 'HR Prospector' },
  { to: '/jobs', icon: '🎯', label: 'Job Feed' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>CareerLens</h1>
        <span>AI Career Intelligence</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <span className="icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
