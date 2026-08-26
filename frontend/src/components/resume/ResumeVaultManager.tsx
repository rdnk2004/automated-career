import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TargetedResume } from '@/types/resume';
import { toast } from '@/hooks/useToast';
import {
  FileText,
  Plus,
  Trash2,
  Star,
  Download,
  Upload,
  Layers,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeVaultManagerProps {
  resumes: TargetedResume[];
  selectedResumeId: string | null;
  onSelectResume: (resume: TargetedResume) => void;
  onCreateResume: (payload: { title: string; target_role: string; raw_text: string; is_primary: boolean }) => void;
  onDeleteResume: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onExportPdf?: () => void;
  isExporting?: boolean;
  activeRole: string;
  onSelectRole: (role: string) => void;
}

export function ResumeVaultManager({
  resumes,
  selectedResumeId,
  onSelectResume,
  onCreateResume,
  onDeleteResume,
  onSetPrimary,
  onExportPdf,
  isExporting,
  activeRole,
  onSelectRole,
}: ResumeVaultManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState(activeRole);
  const [newText, setNewText] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | string>('all');

  // Extract distinct roles from saved resumes
  const distinctRoles = Array.from(new Set(resumes.map((r) => r.target_role))).filter(Boolean);
  if (!distinctRoles.includes('AI Engineer')) distinctRoles.unshift('AI Engineer');
  if (!distinctRoles.includes('Full Stack Developer')) distinctRoles.push('Full Stack Developer');

  const filteredResumes = resumes.filter((r) => {
    if (roleFilter === 'all') return true;
    return r.target_role.toLowerCase() === roleFilter.toLowerCase();
  });

  const handleOpenCreate = () => {
    setNewTitle(`${activeRole} Targeted Resume`);
    setNewRole(activeRole);
    setNewText('');
    setIsPrimary(resumes.filter((r) => r.target_role === activeRole).length === 0);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (!newTitle.trim() || !newText.trim()) {
      toast.error('Missing Information', 'Please provide a title and resume text.');
      return;
    }
    onCreateResume({
      title: newTitle.trim(),
      target_role: newRole.trim() || activeRole,
      raw_text: newText.trim(),
      is_primary: isPrimary,
    });
    setShowCreateModal(false);
    toast.success('Targeted Resume Created', `Saved to vault for ${newRole}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setNewText(content);
        if (!newTitle) {
          setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        toast.success('Resume Text Loaded from File');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Role Filters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-2xl border border-border/40 backdrop-blur-md">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Layers className="h-3 w-3 text-indigo-400" />
            Roles:
          </span>

          <button
            onClick={() => {
              setRoleFilter('all');
            }}
            className={cn(
              'px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all',
              roleFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            All Vault ({resumes.length})
          </button>

          {distinctRoles.map((role) => {
            const count = resumes.filter((r) => r.target_role.toLowerCase() === role.toLowerCase()).length;
            const isSelected = roleFilter === role;
            return (
              <button
                key={role}
                onClick={() => {
                  setRoleFilter(role);
                  onSelectRole(role);
                }}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5',
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <span>{role}</span>
                {count > 0 && (
                  <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono', isSelected ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Create and PDF Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onExportPdf && (
            <Button
              size="xs"
              variant="outline"
              onClick={onExportPdf}
              disabled={isExporting}
              className="h-8 text-xs rounded-xl border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-semibold gap-1.5"
            >
              <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-spin' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export ATS PDF'}
            </Button>
          )}

          <Button
            size="xs"
            onClick={handleOpenCreate}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 rounded-xl font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New Resume
          </Button>
        </div>
      </div>

      {/* Resumes Horizontal List / Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredResumes.map((res) => {
          const isSelected = res.id === selectedResumeId;
          const bsFactor = res.bs_factor || res.last_analysis?.overall_bs_factor;
          const matchScore = res.match_score || res.last_analysis?.match_score;

          return (
            <div
              key={res.id}
              onClick={() => onSelectResume(res)}
              className={cn(
                'p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-2.5 backdrop-blur-md',
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-secondary/30 border-border/40 hover:border-border hover:bg-secondary/50'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold font-heading text-foreground truncate">
                      {res.title}
                    </span>
                    {res.is_primary && (
                      <Badge
                        variant="outline"
                        className="text-[9px] py-0 px-1.5 bg-amber-500/15 text-amber-300 border-amber-500/30 font-mono gap-0.5"
                      >
                        <Star className="h-2.5 w-2.5 fill-amber-400" /> Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    Role: <span className="text-indigo-300 font-semibold">{res.target_role}</span>
                  </p>
                </div>

                {/* Star / Set Primary & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  {!res.is_primary && (
                    <button
                      title="Set as Primary Resume for this role"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetPrimary(res.id);
                        toast.success('Set as Primary Resume');
                      }}
                      className="p-1 text-muted-foreground hover:text-amber-400 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {resumes.length > 1 && (
                    <button
                      title="Delete Resume"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${res.title}"?`)) {
                          onDeleteResume(res.id);
                          toast.info('Resume Removed from Vault');
                        }
                      }}
                      className="p-1 text-muted-foreground hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Badges Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  {bsFactor !== undefined && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-md font-bold',
                        bsFactor <= 4.0
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : bsFactor <= 7.0
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-rose-500/15 text-rose-400'
                      )}
                    >
                      BS: {bsFactor.toFixed(1)}
                    </span>
                  )}

                  {matchScore !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-bold">
                      Match: {matchScore}%
                    </span>
                  )}
                </div>

                <span className="text-muted-foreground text-[9px]">
                  {res.raw_text.split(/\s+/).length} words
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create New Resume Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-border/60 rounded-3xl p-6 shadow-2xl max-w-2xl w-full space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-foreground">
                    Create Role-Targeted Resume
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Store and optimize separate resumes for specific engineering roles
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Resume Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. AI Systems Architect Resume"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-border/50 bg-slate-950 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Target Role</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="e.g. AI Engineer"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-border/50 bg-slate-950 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Resume Content (Markdown / Plaintext)</label>
                  <label className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1 font-semibold">
                    <Upload className="h-3 w-3" />
                    Upload .txt/.md
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={10}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Paste your resume summary, experience bullets, projects, and skills here..."
                  className="w-full p-3.5 text-xs font-mono rounded-xl border border-border/50 bg-slate-950 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_primary_checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-border/50 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="is_primary_checkbox" className="text-xs text-muted-foreground cursor-pointer">
                  Set as Primary default resume for <span className="font-semibold text-foreground">{newRole}</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold px-4"
              >
                Save to Vault
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
