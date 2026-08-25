import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, Home, Compass } from 'lucide-react';
import React from 'react';

// --- Lazy-Loaded Page Chunks ---
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const LinkedIn = lazy(() => import('@/pages/LinkedIn'));
const GitHub = lazy(() => import('@/pages/GitHub'));
const Resume = lazy(() => import('@/pages/Resume'));
const Settings = lazy(() => import('@/pages/Settings'));

// --- Graceful Page Suspense Loader ---
function PageLoader() {
  return (
    <div className="flex h-[75vh] items-center justify-center">
      <div className="p-8 glass-panel rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col items-center gap-4 text-center animate-fade-in max-w-xs">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Sparkles className="h-5 w-5 text-indigo-400 absolute" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold font-heading text-foreground">Loading Workspace</h4>
          <p className="text-[11px] text-muted-foreground">Initializing studio environment...</p>
        </div>
      </div>
    </div>
  );
}

// --- 404 Not Found Page ---
function NotFound() {
  return (
    <div className="flex h-[75vh] items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-10 max-w-md text-center space-y-4 border border-border/40 shadow-2xl animate-pop-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <Compass className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-heading text-foreground">Route Not Found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The workspace location you are trying to reach does not exist in Career OS.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs gap-1.5 shadow-md">
            <Link to="/">
              <Home className="h-3.5 w-3.5" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Error Boundary ---
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught Career OS runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-950 p-6">
          <div className="text-center space-y-4 max-w-md p-8 glass-panel rounded-3xl border border-rose-500/30 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-heading text-rose-400">Application Error</h2>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {this.state.error?.message || 'An unexpected client-side error occurred.'}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App ---
function App() {
  return (
    <ErrorBoundary>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/linkedin" element={<LinkedIn />} />
            <Route path="/github" element={<GitHub />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
