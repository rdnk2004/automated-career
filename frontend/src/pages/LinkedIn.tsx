import { useState, useRef } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLinkedInAnalysis } from '@/hooks/useAnalysis';
import { useProfile, useImportLinkedIn } from '@/hooks/useProfile';
import { toast } from '@/hooks/useToast';
import { ProfileEditor } from '@/components/linkedin/ProfileEditor';
import { LinkedInCategorizedStudio } from '@/components/linkedin/LinkedInCategorizedStudio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Linkedin as LinkedinIcon,
  Target,
  Award,
  UploadCloud,
  X,
  FileArchive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LinkedIn() {
  const { targetRole, setTargetRole } = useSettingsStore();
  const [roleInput, setRoleInput] = useState(targetRole);
  const { mutate: runAnalysis, isPending, data: suggestions } = useLinkedInAnalysis(targetRole);
  const { data: profile } = useProfile();
  const { mutate: importProfileMutate, isPending: isImporting } = useImportLinkedIn();

  // State controlling whether the AI Analysis Studio is open or closed
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  const handleRunAnalysis = () => {
    const role = roleInput.trim() || targetRole;
    if (role !== targetRole) {
      setTargetRole(role);
    }
    setIsAiStudioOpen(true);
    toast.ai('Analyzing LinkedIn Profile...', `Scanning profile sections against live ${role} JDs & GitHub projects`);
    runAnalysis(undefined, {
      onSuccess: () => {
        toast.success('LinkedIn Analysis Complete!');
        setIsAiStudioOpen(true);
      },
      onError: (err: any) => toast.error('Analysis failed', err?.message),
    });
  };

  const handleZipFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Invalid File Type', 'Please upload a LinkedIn Data Export .ZIP archive.');
      return;
    }
    toast.info('Importing LinkedIn Data', `Parsing archive: ${file.name}`);
    importProfileMutate(file, {
      onSuccess: () => {
        toast.success('Import Successful', 'LinkedIn profile sections imported and organized');
        setShowImportModal(false);
      },
      onError: (err: any) => {
        toast.error('Import Failed', err?.message || 'Could not parse LinkedIn ZIP');
      },
    });
  };

  // Profile Strength Score
  const displayScore = suggestions?.profile_score ?? (
    profile?.sections?.length ? 82 : null
  );

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      {/* Top Navigation & Studio Controls */}
      <div className="p-4 sm:px-8 border-b border-border/40 bg-secondary/30 backdrop-blur-md shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left: Branding & Strength Badge */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
              <LinkedinIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold font-heading tracking-tight text-foreground">
                  LinkedIn Studio
                </h2>
                {displayScore !== null && (
                  <Badge
                    variant="outline"
                    className="text-xs font-mono bg-blue-500/10 text-blue-300 border-blue-500/30 px-2 py-0.5 flex items-center gap-1"
                  >
                    <Award className="h-3 w-3 text-blue-400" />
                    Strength: <strong className="text-white">{displayScore}%</strong>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Clean, organized LinkedIn sections with on-demand AI optimization
              </p>
            </div>
          </div>

          {/* Middle/Right: Target Role, Run Analysis & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Role Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 rounded-xl border border-border/40 h-9 min-w-[200px]">
              <Target className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <Input
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                placeholder="Target Role (e.g. AI Engineer)"
                className="h-6 text-xs bg-transparent border-0 p-0 focus-visible:ring-0 text-foreground"
              />
            </div>

            {/* Run Analysis Button */}
            <Button
              onClick={handleRunAnalysis}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 rounded-xl px-3.5 h-9 text-xs font-semibold gap-1.5"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
              {isPending ? 'Analyzing...' : 'Run AI Analysis'}
            </Button>

            {/* AI Studio Toggle Button */}
            <Button
              variant={isAiStudioOpen ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsAiStudioOpen(!isAiStudioOpen)}
              className={cn(
                'h-9 text-xs rounded-xl font-semibold gap-1.5 transition-all',
                isAiStudioOpen
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25'
                  : 'border-purple-500/30 text-purple-300 hover:bg-purple-500/10'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isAiStudioOpen ? 'Hide AI Studio' : 'Open AI Studio'}
              {suggestions && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </Button>

            {/* ZIP Import Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
              className="h-9 text-xs border-border/40 text-muted-foreground hover:text-foreground rounded-xl gap-1.5"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Import ZIP
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-hidden">
        {isAiStudioOpen ? (
          /* Dual-Column Split Mode: Left Organized Profile Sections, Right Categorized AI Studio */
          <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Left: Organized Profile Sections */}
            <div className="w-full lg:w-1/2 p-4 sm:p-6 overflow-y-auto border-r border-border/40 space-y-6">
              <ProfileEditor />
            </div>

            {/* Right: Categorized AI Intelligence Studio */}
            <div className="w-full lg:w-1/2 p-4 sm:p-6 overflow-y-auto bg-card/20 backdrop-blur-xl relative">
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => setIsAiStudioOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs flex items-center gap-1 font-mono"
                  title="Close AI Studio to focus on Profile"
                >
                  <X className="h-3.5 w-3.5" />
                  Close Panel
                </button>
              </div>
              <LinkedInCategorizedStudio
                suggestions={suggestions || null}
                isLoading={isPending}
                profile={profile || null}
                targetRole={roleInput || targetRole || 'AI Engineer'}
              />
            </div>
          </div>
        ) : (
          /* Single Column Full Width: Focused, spacious, highly visible profile sections */
          <div className="h-full overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {suggestions && (
                <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/25 flex items-center justify-between gap-3 animate-fade-in shadow-sm">
                  <div className="flex items-center gap-2.5 text-xs text-purple-200">
                    <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>
                      AI Optimization insights are ready for <strong className="text-white">{roleInput || targetRole}</strong>.
                    </span>
                  </div>
                  <Button
                    size="xs"
                    onClick={() => setIsAiStudioOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold h-7 px-3 shrink-0"
                  >
                    View Insights (4 Categories)
                  </Button>
                </div>
              )}

              <ProfileEditor />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LINKEDIN ZIP IMPORT MODAL                                                 */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card border-border/50 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/30 bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileArchive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-foreground">
                    Import LinkedIn Data Export
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Upload Complete_LinkedInDataExport.zip
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingZip(true);
                }}
                onDragLeave={() => setIsDraggingZip(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingZip(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleZipFile(f);
                }}
                onClick={() => zipInputRef.current?.click()}
                className={cn(
                  'p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer space-y-2',
                  isDraggingZip
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-border/60 hover:border-blue-500/40 bg-secondary/20'
                )}
              >
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleZipFile(f);
                  }}
                />

                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 w-12 h-12 flex items-center justify-center mx-auto">
                  <UploadCloud className="h-6 w-6" />
                </div>

                <p className="text-xs font-bold text-foreground">
                  Click to browse or drop your LinkedIn export .ZIP file
                </p>
                <p className="text-[10px] text-muted-foreground">
                  (Settings → Data Privacy → Get a copy of your data on LinkedIn)
                </p>
              </div>

              {isImporting && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-center text-xs text-blue-200 animate-pulse">
                  Extracting and parsing profile sections...
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border/30 bg-secondary/30 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImportModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
