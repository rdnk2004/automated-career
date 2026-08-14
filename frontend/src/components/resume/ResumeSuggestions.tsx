import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useResumeSuggestion } from '@/hooks/useJobSearch';
import { useJobStore } from '@/stores/jobStore';
import { analysisApi } from '@/services/analysisApi';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Sparkles, FileText, Download, Copy, Check, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResumeSuggestions() {
  const { activeTitle } = useJobStore();
  const [resumeText, setResumeText] = useState('');
  const { mutate: analyzeResume, data: suggestions, isPending } = useResumeSuggestion();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleAnalyze = () => {
    if (resumeText.trim()) {
      analyzeResume({ resumeText, targetRole: activeTitle });
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const bullets = suggestions?.bullet_rewrites.map(b => b.suggested) || [];
      const extractedSkills: string[] = (suggestions?.gap_keywords || []).map((k: any) =>
        typeof k === 'string' ? k : k.keyword || ''
      ).filter(Boolean);

      await analysisApi.exportResumePdf({
        target_role: activeTitle || "Software Engineer",
        summary: resumeText.trim().slice(0, 400),
        experience: [
          {
            title: activeTitle || "Software Engineer",
            company: "Target Career History",
            bullets: bullets.length > 0 ? bullets : [resumeText.trim()]
          }
        ],
        skills: extractedSkills.length > 0 ? extractedSkills : ["Python", "TypeScript", "FastAPI", "React"]
      });
    } catch (err) {
      console.error("Failed to export ATS PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Input Resume Box */}
      <Card className="flex-shrink-0 glass-card border-border/40 shadow-xl rounded-2xl">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-sm font-bold font-heading flex justify-between items-center text-foreground">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Input Current Resume Text
            </span>
            {suggestions && (
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold px-2.5 py-0.5 border",
                  suggestions.match_score > 75
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/25"
                )}
              >
                ATS Match: {suggestions.match_score}/100
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <textarea
            className="w-full h-32 p-3.5 text-xs rounded-xl border border-border/40 bg-slate-950/80 font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner"
            placeholder="Paste your current resume summary or bullet points here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button
              onClick={handleAnalyze}
              disabled={isPending || !resumeText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-5 text-xs font-semibold gap-1.5"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
              {isPending ? 'Analyzing Resume...' : 'Generate Suggestions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Output Card */}
      {suggestions && (
        <Card className="flex-1 overflow-y-auto glass-card border-border/40 shadow-xl rounded-2xl flex flex-col">
          <CardHeader className="pb-3 border-b border-border/30 bg-secondary/30">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-400" />
                AI Bullet Point Rewrites
              </CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="text-xs rounded-xl gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
              >
                <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-spin' : ''}`} />
                {isExporting ? 'Generating PDF...' : 'Download ATS PDF'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto">
            {suggestions.bullet_rewrites.map((rewrite, idx) => (
              <div key={idx} className="border border-border/40 rounded-2xl overflow-hidden glass-card shadow-lg">
                <div className="bg-secondary/40 px-3.5 py-2 text-xs font-semibold flex items-center justify-between border-b border-border/30">
                  <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground text-[10px]">Evidence:</span>
                    {rewrite.evidence_refs?.map(ref => (
                      <Badge key={ref} variant="outline" className="text-[10px] py-0 px-2 bg-indigo-500/15 text-indigo-300 border-indigo-500/20 font-mono">
                        {ref}
                      </Badge>
                    ))}
                    {(!rewrite.evidence_refs || rewrite.evidence_refs.length === 0) && (
                      <span className="font-normal italic text-muted-foreground text-[10px]">Market best practice</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1" 
                    onClick={() => copyToClipboard(rewrite.suggested, idx)}
                  >
                    {copiedIdx === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedIdx === idx ? 'Copied' : 'Copy'}
                  </Button>
                </div>

                <div className="p-2 bg-slate-950/70 text-xs">
                  {rewrite.original ? (
                    <ReactDiffViewer 
                      oldValue={rewrite.original} 
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
                  ) : (
                    <div className="p-3 text-xs bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 font-medium">
                      <span className="font-bold mr-2 text-emerald-400">+</span>
                      {rewrite.suggested}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {suggestions.bullet_rewrites.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No specific bullet point rewrites suggested.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
