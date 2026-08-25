import { useState } from 'react';
import { SuggestionSet } from '@/types/analysis';
import { KeywordGapBadges } from './KeywordGapBadges';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useImportLinkedIn, useProfile, useUpdateSection } from '@/hooks/useProfile';
import { useProfileStore } from '@/stores/profileStore';
import { toast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  Sparkles,
  Key,
  FileDiff,
  Check,
  Copy,
  ArrowRight,
  Columns,
  Rows,
  FileArchive,
  Info,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SuggestionPanel({
  suggestions,
  isLoading = false,
}: {
  suggestions: SuggestionSet | null;
  isLoading?: boolean;
}) {
  const [tab, setTab] = useState<'gaps' | 'rewrites' | 'import'>('gaps');
  const [splitView, setSplitView] = useState(false);
  const { mutate: importProfile, isPending: isImporting } = useImportLinkedIn();
  const { data: profile } = useProfile();
  const { mutate: updateSection } = useUpdateSection();
  const { setDraftContent } = useProfileStore();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.zip')) {
      toast.error('Invalid File Type', 'Please select a LinkedIn Data Export .ZIP archive');
      return;
    }
    toast.info('Importing LinkedIn Data', `Parsing archive: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    importProfile(file, {
      onSuccess: () => {
        toast.success('Import Successful', 'LinkedIn profile sections imported and scored');
        setTab('rewrites');
      },
      onError: (err: any) => {
        toast.error('Import Failed', err?.message || 'Could not parse LinkedIn ZIP');
      },
    });
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copied to Clipboard');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleApplyRewrite = (rewrite: any, idx: number) => {
    if (!profile || !profile.sections) return;

    // Find the section that matches
    const targetSec = profile.sections.find((s) => {
      const orig = rewrite.original?.toLowerCase() || '';
      const contentStr = JSON.stringify(s.content).toLowerCase();
      return contentStr.includes(orig.slice(0, 30));
    }) || profile.sections.find((s) => s.section_type.toLowerCase() === 'experience');

    if (targetSec) {
      setDraftContent(targetSec.id, {
        ...targetSec.content,
        suggestedRewrite: rewrite.suggested,
      });
      setAppliedIndices((prev) => new Set(prev).add(idx));
      toast.success(
        'Applied to Draft Editor',
        `Staged rewrite in ${targetSec.title || targetSec.section_type}`
      );
    } else {
      copyText(rewrite.suggested, idx);
    }
  };

  const handleApplyAllRewrites = () => {
    if (!suggestions || suggestions.rewrites.length === 0) return;
    suggestions.rewrites.forEach((rw, idx) => {
      handleApplyRewrite(rw, idx);
    });
    toast.success('All AI Rewrites Staged', 'Review draft updates in the left editor panel');
  };

  return (
    <Card className="flex flex-col h-full border-l border-border/40 bg-card/60 backdrop-blur-xl rounded-none shadow-2xl overflow-hidden">
      {/* Studio Header & Tab Switcher */}
      <div className="flex items-center justify-between border-b border-border/40 p-2.5 bg-secondary/30">
        <div className="flex items-center gap-1">
          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none',
              tab === 'gaps'
                ? 'bg-primary text-primary-foreground shadow-md shadow-indigo-600/25'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
            onClick={() => setTab('gaps')}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Keyword Gaps</span>
            {suggestions?.keyword_gaps?.length ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 ml-1">
                {suggestions.keyword_gaps.length}
              </span>
            ) : null}
          </button>

          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none',
              tab === 'rewrites'
                ? 'bg-primary text-primary-foreground shadow-md shadow-indigo-600/25'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
            onClick={() => setTab('rewrites')}
          >
            <FileDiff className="h-3.5 w-3.5" />
            <span>AI Rewrites</span>
            {suggestions?.rewrites?.length ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 ml-1">
                {suggestions.rewrites.length}
              </span>
            ) : null}
          </button>

          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none',
              tab === 'import'
                ? 'bg-primary text-primary-foreground shadow-md shadow-indigo-600/25'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )}
            onClick={() => setTab('import')}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Import ZIP</span>
          </button>
        </div>

        {tab === 'rewrites' && suggestions?.rewrites?.length ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSplitView(!splitView)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              title={splitView ? 'Switch to Unified Diff' : 'Switch to Split Diff'}
            >
              {splitView ? <Rows className="h-3.5 w-3.5" /> : <Columns className="h-3.5 w-3.5" />}
            </button>
            <Button
              size="xs"
              variant="outline"
              onClick={handleApplyAllRewrites}
              className="h-7 text-[11px] font-semibold gap-1 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20"
            >
              <CheckCheck className="h-3 w-3" />
              Apply All
            </Button>
          </div>
        ) : null}
      </div>

      {/* Tab Content Body */}
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        {/* TAB 1: KEYWORD GAPS */}
        {tab === 'gaps' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-indigo-400" />
                  Missing Market Keywords
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  High-frequency skills extracted from live target JDs that are absent from your LinkedIn profile.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Analyzing profile keywords against market JDs...</p>
              </div>
            ) : suggestions ? (
              <KeywordGapBadges gaps={suggestions.keyword_gaps} />
            ) : (
              <div className="p-10 text-center text-muted-foreground glass-card rounded-2xl border border-dashed border-border/40 text-xs space-y-3 shadow-xl">
                <Sparkles className="h-8 w-8 text-indigo-400/50 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-bold font-heading text-foreground text-sm">No Keyword Gaps Analyzed</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Click <strong className="text-indigo-300">"Run Analysis"</strong> at the top to scan your profile against live Indeed job listings.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI REWRITES */}
        {tab === 'rewrites' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                <FileDiff className="h-4 w-4 text-indigo-400" />
                Contextual AI Bullet Rewrites
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reframed bullet points optimized for quantified impact, action verbs, and keyword density.
              </p>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Synthesizing bullet rewrites with Gemini 2.5 Pro...</p>
              </div>
            ) : !suggestions || suggestions.rewrites.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground glass-card rounded-2xl border border-dashed border-border/40 text-xs space-y-3 shadow-xl">
                <Sparkles className="h-8 w-8 text-indigo-400/50 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold font-heading text-foreground text-sm">No Rewrites Generated</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Run LinkedIn Analysis to generate targeted bullet rewrites and evidence citations.
                  </p>
                </div>
              </div>
            ) : (
              suggestions.rewrites.map((rewrite, i) => {
                const isApplied = appliedIndices.has(i);

                return (
                  <div
                    key={i}
                    className="border border-border/40 rounded-2xl overflow-hidden glass-card shadow-xl transition-all hover:border-indigo-500/40"
                  >
                    {/* Header Bar */}
                    <div className="bg-secondary/40 px-4 py-2.5 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/20 font-mono">
                          Rewrite #{i + 1}
                        </Badge>
                        {rewrite.evidence_refs?.map((ref) => (
                          <span
                            key={ref}
                            className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono"
                          >
                            Ref: {ref}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                          onClick={() => copyText(rewrite.suggested, i)}
                        >
                          {copiedIdx === i ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          {copiedIdx === i ? 'Copied' : 'Copy'}
                        </Button>

                        <Button
                          size="xs"
                          onClick={() => handleApplyRewrite(rewrite, i)}
                          className={cn(
                            'h-6 text-[11px] px-2.5 gap-1 font-semibold rounded-lg shadow-sm',
                            isApplied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          )}
                        >
                          {isApplied ? <Check className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                          {isApplied ? 'Staged' : 'Apply to Draft'}
                        </Button>
                      </div>
                    </div>

                    {/* Interactive Diff Viewer */}
                    <div className="p-2 bg-slate-950/80 text-xs overflow-x-auto">
                      <ReactDiffViewer
                        oldValue={rewrite.original || 'No original text'}
                        newValue={rewrite.suggested}
                        splitView={splitView}
                        hideLineNumbers
                        styles={{
                          variables: {
                            dark: {
                              diffViewerBackground: 'transparent',
                              addedBackground: 'rgba(16, 185, 129, 0.15)',
                              removedBackground: 'rgba(239, 68, 68, 0.15)',
                              wordAddedBackground: 'rgba(16, 185, 129, 0.35)',
                              wordRemovedBackground: 'rgba(239, 68, 68, 0.35)',
                              addedColor: '#34d399',
                              removedColor: '#f87171',
                            },
                          },
                        }}
                        useDarkTheme
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: IMPORT ZIP ARCHIVE */}
        {tab === 'import' && (
          <div className="space-y-6 animate-fade-in">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center min-h-[280px] border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200',
                isDragOver
                  ? 'border-indigo-400 bg-indigo-500/20 scale-[1.01]'
                  : 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10'
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-glow">
                <FileArchive className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold font-heading text-foreground mb-1">
                Upload LinkedIn Data Archive
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mb-6 leading-relaxed">
                Drag and drop your LinkedIn Data Export <code className="text-indigo-300 font-mono">.ZIP</code> file here, or browse files on your computer.
              </p>

              <input
                type="file"
                accept=".zip"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="zip-upload"
                disabled={isImporting}
              />
              <label htmlFor="zip-upload">
                <Button
                  asChild
                  isLoading={isImporting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-6 h-10 text-xs font-semibold cursor-pointer"
                >
                  <span>{isImporting ? 'Parsing LinkedIn Archive...' : 'Select ZIP File'}</span>
                </Button>
              </label>
            </div>

            {/* LinkedIn Export Tutorial Box */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-border/40 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Info className="h-4 w-4 text-indigo-400" />
                How to download your LinkedIn Data Export
              </div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] pl-1 leading-relaxed">
                <li>Go to LinkedIn Settings & Privacy &gt; <strong>Data Privacy</strong>.</li>
                <li>Under "How LinkedIn uses your data", select <strong>"Get a copy of your data"</strong>.</li>
                <li>Choose "Download larger data archive" or "Want something in particular? (Profile, Positions)".</li>
                <li>When LinkedIn emails you the ZIP download link, upload the archive here.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
