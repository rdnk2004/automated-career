import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TargetedResume } from '@/types/resume';
import { useUploadResume } from '@/hooks/useResumes';
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
  Sparkles,
  FileCheck2,
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
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Manual create form state
  const [newTitle, setNewTitle] = useState('');
  const [newRole, setNewRole] = useState(activeRole);
  const [newText, setNewText] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  // Upload modal state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadRole, setUploadRole] = useState(activeRole);
  const [uploadIsPrimary, setUploadIsPrimary] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { mutate: uploadResumeMutate, isPending: isUploading } = useUploadResume();

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

  const handleSaveManual = () => {
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

  const handleOpenUpload = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadRole(activeRole);
    setUploadIsPrimary(resumes.filter((r) => r.target_role === activeRole).length === 0);
    setShowUploadModal(true);
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.txt') && !ext.endsWith('.md')) {
      toast.error('Unsupported File Type', 'Please upload a .PDF, .TXT, or .MD resume file.');
      return;
    }
    setUploadFile(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setUploadTitle(`${cleanName}`);
    toast.info('File Selected', `${file.name} ready for spatial extraction`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUploadSubmit = () => {
    if (!uploadFile) {
      toast.error('No File Selected', 'Please select or drop a resume PDF file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('target_role', uploadRole.trim() || activeRole);
    if (uploadTitle.trim()) {
      formData.append('title', uploadTitle.trim());
    }
    formData.append('is_primary', uploadIsPrimary ? 'true' : 'false');

    toast.ai(
      'Extracting & Parsing Resume...',
      'Running layout-aware spatial scraper and Gemini 3.6 Flash structured extraction'
    );

    uploadResumeMutate(formData, {
      onSuccess: (data) => {
        toast.success(
          'Resume Scraped & Saved to Vault!',
          `Loaded ${data.title} for ${data.target_role}`
        );
        setShowUploadModal(false);
        onSelectResume(data);
      },
      onError: (err: any) => {
        toast.error('Resume Extraction Failed', err?.message || 'Could not parse resume PDF');
      },
    });
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
            onClick={() => setRoleFilter('all')}
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

        {/* Action Buttons: Upload PDF, New Resume, Export ATS PDF */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onExportPdf && resumes.length > 0 && (
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
            onClick={handleOpenUpload}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 rounded-xl font-semibold gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload PDF Resume
          </Button>

          <Button
            size="xs"
            onClick={handleOpenCreate}
            variant="outline"
            className="h-8 text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 rounded-xl font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New Blank
          </Button>
        </div>
      </div>

      {/* Resumes Grid / Empty State */}
      {resumes.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border/50 bg-secondary/20 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-glow">
            <Upload className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-bold font-heading text-foreground">
              Your Resume Vault is Empty
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload your existing resume PDF to run high-precision spatial text extraction and Gemini 3.6 Flash structured parsing, or create a blank role-targeted resume.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              onClick={handleOpenUpload}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold gap-2 shadow-lg shadow-emerald-600/30 h-9 px-4"
            >
              <Upload className="h-4 w-4" />
              Upload PDF Resume
            </Button>
            <Button
              onClick={handleOpenCreate}
              variant="outline"
              className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 rounded-xl text-xs font-semibold gap-2 h-9 px-4"
            >
              <Plus className="h-4 w-4" />
              Create Blank Resume
            </Button>
          </div>
        </div>
      ) : (
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
                    <button
                      title={res.is_primary ? "Primary Resume" : "Click to Set as Primary Resume"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetPrimary(res.id);
                        toast.success('Set as Primary Resume for ' + res.target_role);
                      }}
                      className={cn(
                        'p-1 transition-colors rounded-lg',
                        res.is_primary
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-muted-foreground hover:text-amber-400 hover:bg-secondary/60'
                      )}
                    >
                      <Star className={cn('h-3.5 w-3.5', res.is_primary ? 'fill-amber-400' : '')} />
                    </button>

                    <button
                      title="Delete Resume"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${res.title}"?`)) {
                          onDeleteResume(res.id);
                          toast.info('Resume Removed from Vault');
                        }
                      }}
                      className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 font-bold">
                        ATS: {matchScore}%
                      </span>
                    )}
                  </div>

                  <span className="text-muted-foreground">
                    {res.raw_text ? res.raw_text.split(/\s+/).length : 0} words
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD PDF RESUME MODAL                                                   */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card border-border/50 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/30 bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-foreground">
                    Upload & Scrape Resume PDF
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    High-precision layout text scraper + Gemini 3.6 Flash structured parser
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer space-y-2.5',
                  isDragging
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : uploadFile
                    ? 'border-emerald-500/50 bg-secondary/30'
                    : 'border-border/60 hover:border-emerald-500/40 bg-secondary/20'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />

                {uploadFile ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <FileCheck2 className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-foreground text-sm">{uploadFile.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(uploadFile.size / 1024).toFixed(1)} KB • Ready to Scrape
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold underline mt-1">
                      Click to choose a different file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-3 rounded-2xl bg-secondary/60 text-muted-foreground border border-border/40">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-foreground text-sm">
                      Drag & Drop your Resume PDF here
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      or click to browse from your computer (.PDF, .TXT, .MD)
                    </span>
                  </div>
                )}
              </div>

              {/* Target Role Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground">Target Role</label>
                <Input
                  value={uploadRole}
                  onChange={(e) => setUploadRole(e.target.value)}
                  placeholder="e.g. AI Systems Engineer, Full Stack Developer"
                  className="h-9 text-xs bg-slate-950/70 border-border/40 rounded-xl"
                />
              </div>

              {/* Resume Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground">Resume Title in Vault</label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Master AI Engineer Resume"
                  className="h-9 text-xs bg-slate-950/70 border-border/40 rounded-xl"
                />
              </div>

              {/* Primary Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/30 bg-secondary/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadIsPrimary}
                  onChange={(e) => setUploadIsPrimary(e.target.checked)}
                  className="rounded border-border/40 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-foreground">Set as Primary Resume for this role</span>
                  <p className="text-[10px] text-muted-foreground">
                    Will be automatically loaded when reviewing {uploadRole || 'this role'}
                  </p>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/30 bg-secondary/30 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUploadSubmit}
                disabled={!uploadFile || isUploading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold gap-1.5 h-9 px-4 shadow-lg shadow-emerald-600/30"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                {isUploading ? 'Scraping PDF with Gemini...' : 'Scrape & Save to Vault'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANUAL BLANK RESUME MODAL                                                 */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card border-border/50 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border/30 bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-foreground">
                    Create Blank Targeted Resume
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Add a customized resume text tailored for a specific role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground">Resume Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. MLOps Engineer Resume"
                  className="h-9 text-xs bg-slate-950/70 border-border/40 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground">Target Role</label>
                <Input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. AI Systems Engineer"
                  className="h-9 text-xs bg-slate-950/70 border-border/40 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground">Resume Content</label>
                <textarea
                  rows={8}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Paste candidate summary, experience bullets, and skills..."
                  className="w-full p-3 text-xs font-mono rounded-xl border border-border/40 bg-slate-950/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/30 bg-secondary/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-border/40 text-indigo-500 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-foreground">Set as Primary Resume for this role</span>
                  <p className="text-[10px] text-muted-foreground">
                    Will be default when searching for {newRole || 'this role'}
                  </p>
                </div>
              </label>
            </div>

            <div className="p-4 border-t border-border/30 bg-secondary/30 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveManual}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold gap-1.5 h-9 px-4 shadow-lg shadow-indigo-600/30"
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
