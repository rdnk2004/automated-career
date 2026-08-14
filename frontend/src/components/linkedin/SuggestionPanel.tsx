import { useState } from 'react';
import { SuggestionSet } from '@/types/analysis';
import { KeywordGapBadges } from './KeywordGapBadges';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useImportLinkedIn } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadCloud, Sparkles, Key, FileDiff, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SuggestionPanel({ suggestions }: { suggestions: SuggestionSet | null }) {
  const [tab, setTab] = useState<'gaps' | 'rewrites' | 'import'>('gaps');
  const { mutate: importProfile, isPending } = useImportLinkedIn();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importProfile(e.target.files[0]);
    }
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Card className="flex flex-col h-full border-l border-border/40 bg-card/60 backdrop-blur-xl rounded-none shadow-2xl">
      {/* Tabs Header */}
      <div className="flex border-b border-border/40 p-2 gap-1 bg-secondary/30">
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
            tab === 'gaps'
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
          onClick={() => setTab('gaps')}
        >
          <Key className="h-3.5 w-3.5" />
          Keyword Gaps
        </button>
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
            tab === 'rewrites'
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
          onClick={() => setTab('rewrites')}
        >
          <FileDiff className="h-3.5 w-3.5" />
          AI Rewrites
        </button>
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200",
            tab === 'import'
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
          onClick={() => setTab('import')}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Import ZIP
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        {tab === 'import' && (
          <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-indigo-500/30 rounded-3xl p-8 text-center bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold font-heading text-foreground mb-1">
              Upload LinkedIn Data Export
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-6 leading-relaxed">
              Drag and drop or select your LinkedIn Data Export ZIP file containing <code className="text-indigo-400 font-mono">Profile.csv</code>, <code className="text-indigo-400 font-mono">Positions.csv</code>, etc.
            </p>
            <input
              type="file"
              accept=".zip"
              onChange={handleFileUpload}
              className="hidden"
              id="zip-upload"
              disabled={isPending}
            />
            <label htmlFor="zip-upload">
              <Button asChild disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl cursor-pointer">
                <span>{isPending ? 'Importing ZIP...' : 'Select ZIP File'}</span>
              </Button>
            </label>
          </div>
        )}

        {tab === 'gaps' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-indigo-400" />
                Missing High-Frequency Keywords
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keywords detected in live market job descriptions that are absent from your LinkedIn profile.
              </p>
            </div>

            {suggestions ? (
              <KeywordGapBadges gaps={suggestions.keyword_gaps} />
            ) : (
              <div className="p-8 text-center text-muted-foreground glass-card rounded-2xl border border-dashed text-xs space-y-2">
                <Sparkles className="h-6 w-6 text-indigo-400/50 mx-auto" />
                <p>Click "Run Analysis" on the header to identify missing market keywords.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'rewrites' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                <FileDiff className="h-4 w-4 text-indigo-400" />
                AI-Powered Bullet Point Rewrites
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Contextual section reframing optimized for keyword density and high-impact phrasing.
              </p>
            </div>

            {!suggestions && (
              <div className="p-8 text-center text-muted-foreground glass-card rounded-2xl border border-dashed text-xs space-y-2">
                <Sparkles className="h-6 w-6 text-indigo-400/50 mx-auto" />
                <p>Run LinkedIn Analysis to generate section rewrites.</p>
              </div>
            )}

            {suggestions?.rewrites.map((rewrite, i) => (
              <div key={i} className="border border-border/40 rounded-2xl overflow-hidden glass-card shadow-lg">
                <div className="bg-secondary/40 px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px]">Evidence:</span>
                    {rewrite.evidence_refs?.map((ref) => (
                      <span key={ref} className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">
                        {ref}
                      </span>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => copyText(rewrite.suggested, i)}
                  >
                    {copiedIdx === i ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedIdx === i ? 'Copied' : 'Copy'}
                  </Button>
                </div>

                <div className="p-2 bg-slate-950/70 text-xs">
                  <ReactDiffViewer
                    oldValue={rewrite.original || ''}
                    newValue={rewrite.suggested}
                    splitView={false}
                    hideLineNumbers
                    styles={{
                      variables: {
                        dark: {
                          diffViewerBackground: 'transparent',
                          addedBackground: 'rgba(34, 197, 94, 0.15)',
                          removedBackground: 'rgba(239, 68, 68, 0.15)',
                          wordAddedBackground: 'rgba(34, 197, 94, 0.3)',
                          wordRemovedBackground: 'rgba(239, 68, 68, 0.3)',
                          addedColor: '#4ade80',
                          removedColor: '#f87171',
                        }
                      }
                    }}
                    useDarkTheme
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
