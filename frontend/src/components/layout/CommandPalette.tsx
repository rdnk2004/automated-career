import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from '@/hooks/useHotkeys';
import { toast } from '@/hooks/useToast';
import { useSettingsStore } from '@/stores/settingsStore';
import { useJobStore } from '@/stores/jobStore';
import { useRefreshCareerScore } from '@/hooks/useAnalysis';
import { useSyncRepos } from '@/hooks/useGithubRepos';
import {
  LayoutDashboard,
  Linkedin,
  Github,
  FileText,
  Settings,
  Search,
  Sparkles,
  RefreshCw,
  Target,
  UploadCloud,
  FileCode,
  ArrowRight,
  Command,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Target Roles';
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { targetRole, setTargetRole } = useSettingsStore();
  const { setActiveTitle } = useJobStore();
  const { mutate: refreshScore } = useRefreshCareerScore();
  const { mutate: syncRepos } = useSyncRepos();

  // Listen for Cmd+K / Ctrl+K and Escape
  useHotkeys('ctrl+k, meta+k', () => {
    setIsOpen((prev) => !prev);
  }, { enableOnFormTags: true });

  useHotkeys('escape', () => {
    if (isOpen) setIsOpen(false);
  }, { enableOnFormTags: true });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  const standardRoles = [
    'AI Engineer',
    'Senior Frontend Engineer',
    'Full Stack Developer',
    'MLOps Engineer',
    'Staff Software Engineer',
  ];

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      subtitle: 'Career readiness overview & action priorities',
      icon: LayoutDashboard,
      iconColor: 'text-indigo-400',
      shortcut: 'G D',
      action: () => {
        navigate('/');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-linkedin',
      title: 'Go to LinkedIn Optimization Studio',
      category: 'Navigation',
      subtitle: 'Section scores, keyword gaps & AI rewrites',
      icon: Linkedin,
      iconColor: 'text-blue-400',
      shortcut: 'G L',
      action: () => {
        navigate('/linkedin');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-github',
      title: 'Go to GitHub Portfolio Inspector',
      category: 'Navigation',
      subtitle: 'Security hygiene, leaked secrets & AI README generator',
      icon: Github,
      iconColor: 'text-purple-400',
      shortcut: 'G G',
      action: () => {
        navigate('/github');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-resume',
      title: 'Go to Resume Market Matcher',
      category: 'Navigation',
      subtitle: 'ATS keyword cloud, heatmap matrix & bullet rewriter',
      icon: FileText,
      iconColor: 'text-emerald-400',
      shortcut: 'G R',
      action: () => {
        navigate('/resume');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-settings',
      title: 'Go to System Settings',
      category: 'Navigation',
      subtitle: 'API keys, target roles & n8n scheduled triggers',
      icon: Settings,
      iconColor: 'text-slate-400',
      shortcut: 'G S',
      action: () => {
        navigate('/settings');
        setIsOpen(false);
      },
    },

    // Actions
    {
      id: 'action-audit',
      title: 'Run Career Readiness Audit',
      category: 'Actions',
      subtitle: `Trigger Gemini 2.5 Pro synthesis for "${targetRole}"`,
      icon: Sparkles,
      iconColor: 'text-amber-400',
      shortcut: '↵',
      action: () => {
        setIsOpen(false);
        toast.ai('Synthesizing Career Readiness...', `Evaluating LinkedIn, GitHub, and Indeed signals for ${targetRole}`);
        refreshScore(targetRole, {
          onSuccess: () => toast.success('Career Score Snapshot updated successfully!'),
          onError: (err: any) => toast.error('Audit failed', err?.message || 'Check Gemini API Key configuration'),
        });
      },
    },
    {
      id: 'action-sync-github',
      title: 'Sync GitHub Repositories',
      category: 'Actions',
      subtitle: 'Re-fetch latest repositories and commit metadata',
      icon: RefreshCw,
      iconColor: 'text-indigo-400',
      action: () => {
        setIsOpen(false);
        toast.info('Syncing GitHub Repositories...', 'Pulling latest public and private repositories');
        syncRepos(undefined, {
          onSuccess: () => toast.success('GitHub Repositories synced!'),
          onError: (err: any) => toast.error('Sync failed', err?.message || 'Check GitHub PAT'),
        });
      },
    },
    {
      id: 'action-import-linkedin',
      title: 'Import LinkedIn Data ZIP',
      category: 'Actions',
      subtitle: 'Upload a fresh LinkedIn data export package',
      icon: UploadCloud,
      iconColor: 'text-blue-400',
      action: () => {
        navigate('/linkedin');
        setIsOpen(false);
        toast.info('Navigate to LinkedIn Studio to upload your export ZIP.');
      },
    },
    {
      id: 'action-export-ats-pdf',
      title: 'Generate ATS-Formatted Resume PDF',
      category: 'Actions',
      subtitle: 'Create a tailored, machine-readable resume PDF',
      icon: FileCode,
      iconColor: 'text-emerald-400',
      action: () => {
        navigate('/resume');
        setIsOpen(false);
      },
    },

    // Target Roles
    ...standardRoles.map((role) => ({
      id: `role-${role}`,
      title: `Switch Target Role: ${role}`,
      category: 'Target Roles' as const,
      subtitle: role === targetRole ? 'Currently Active Target Role' : 'Set as primary optimization target',
      icon: Target,
      iconColor: role === targetRole ? 'text-emerald-400' : 'text-slate-400',
      action: () => {
        setTargetRole(role);
        setActiveTitle(role);
        setIsOpen(false);
        toast.success(`Target role switched to "${role}"`);
      },
    })),
  ];

  // Filter commands by query
  const filteredCommands = commands.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  });

  // Handle keyboard navigation in list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-indigo-500/30 bg-slate-950/95 shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[540px] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40 bg-secondary/20">
          <Search className="h-4 w-4 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (e.g. Audit, LinkedIn, AI Engineer)..."
            className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground border border-border/50">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2 text-xs">
              <Command className="h-6 w-6 text-muted-foreground/40 mx-auto" />
              <p>No matching commands found for "{query}".</p>
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-active={isSelected}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => item.action()}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 text-xs group',
                    isSelected
                      ? 'bg-indigo-600/20 text-foreground border border-indigo-500/40 shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        'p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 transition-colors',
                        item.iconColor || 'text-indigo-400'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground truncate flex items-center gap-2">
                        {item.title}
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary/60 text-muted-foreground/80 font-normal">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    {item.shortcut && (
                      <kbd className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded border border-border/40">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5',
                        isSelected ? 'text-indigo-400 opacity-100' : 'opacity-0'
                      )}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-border/30 bg-secondary/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-secondary px-1 py-0.5 rounded text-[10px] border border-border/40">↑</kbd>
              <kbd className="font-mono bg-secondary px-1 py-0.5 rounded text-[10px] border border-border/40">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[10px] border border-border/40">↵</kbd>
              Select
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Target: <strong className="text-foreground">{targetRole}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
