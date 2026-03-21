import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Resume from './pages/Resume';
import Github from './pages/Github';
import LinkedIn from './pages/LinkedIn';
import HRProspector from './pages/HRProspector';
import Jobs from './pages/Jobs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/github" element={<Github />} />
            <Route path="/linkedin" element={<LinkedIn />} />
            <Route path="/hr" element={<HRProspector />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
