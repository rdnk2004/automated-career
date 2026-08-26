import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResumeDestroyerAudit } from '@/types/resume';
import { toast } from '@/hooks/useToast';
import ReactDiffViewer from 'react-diff-viewer-continued';
import {
  Flame,
  Skull,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Target,
  Sparkles,
  ShieldAlert,
  Award,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeDestroyerCardProps {
  audit?: ResumeDestroyerAudit;
  isLoading?: boolean;
  onAnalyze?: () => void;
  targetRole: string;
}

export function ResumeDestroyerCard({
  audit,
  isLoading,
  onAnalyze,
  targetRole,
}: ResumeDestroyerCardProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'teardown' | 'rewrites' | 'reality'>('teardown');

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('PAR Bullet Copied to Clipboard');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getBsFactorColor = (bs: number) => {
    if (bs <= 3.5) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (bs <= 6.5) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getBsFactorLabel = (bs: number) => {
    if (bs <= 3.0) return 'Verified Engineering Truth';
    if (bs <= 5.5) return 'Moderate Buzzword Fluff';
    if (bs <= 7.5) return 'Elevated Corporate Fluff';
    return 'Severe Delusion / Fluff Hazard';
  };

  return (
    <Card className="glass-card border-border/40 shadow-2xl rounded-2xl overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Header */}
      <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-purple-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm">
                <Skull className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-extrabold font-heading text-foreground flex items-center gap-2">
                THE RESUME DESTROYER
                <Badge
                  variant="outline"
                  className="text-[10px] bg-rose-500/10 text-rose-300 border-rose-500/20 font-mono"
                >
                  Gemini 3.6 Flash
                </Badge>
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Merciless 20+ Year Fortune 500 Teardown & Strategic PAR Reconstruction
            </p>
          </div>

          <Button
            onClick={onAnalyze}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 rounded-xl h-9 text-xs font-semibold gap-1.5 shrink-0"
          >
            <Flame className={`h-3.5 w-3.5 ${isLoading ? 'animate-bounce text-amber-300' : ''}`} />
            {isLoading ? 'Executing Teardown...' : 'Run Destroyer Audit'}
          </Button>
        </div>

        {/* Scorecard Hero Banner if audit exists */}
        {audit && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 mt-2 border-t border-border/30">
            {/* BS Factor Metric */}
            <div
              className={cn(
                'p-3 rounded-xl border flex flex-col justify-between backdrop-blur-md',
                getBsFactorColor(audit.overall_bs_factor)
              )}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span>BS Factor</span>
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-black font-heading mt-1">
                {audit.overall_bs_factor.toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground"> / 10</span>
              </div>
              <span className="text-[10px] font-mono tracking-tight mt-0.5">
                {getBsFactorLabel(audit.overall_bs_factor)}
              </span>
            </div>

            {/* ATS Match Score */}
            <div
              className={cn(
                'p-3 rounded-xl border flex flex-col justify-between backdrop-blur-md',
                audit.match_score >= 80
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : audit.match_score >= 60
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
              )}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span>ATS Market Match</span>
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-black font-heading mt-1">
                {audit.match_score}%
              </div>
              <span className="text-[10px] font-mono tracking-tight mt-0.5">
                vs Live {targetRole} JDs
              </span>
            </div>

            {/* Realistic Seniority Level */}
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 flex flex-col justify-between backdrop-blur-md">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span>Realistic Level</span>
                <Target className="h-3.5 w-3.5" />
              </div>
              <div className="text-sm font-bold font-heading line-clamp-1 mt-1 text-foreground">
                {audit.competitive_analysis?.realistic_level || targetRole}
              </div>
              <span className="text-[10px] font-mono text-purple-300/80">
                Market Target Tier
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      {/* Tabs */}
      {audit ? (
        <>
          <div className="flex border-b border-border/30 bg-secondary/20 px-4 pt-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('teardown')}
              className={cn(
                'pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors',
                activeTab === 'teardown'
                  ? 'border-rose-500 text-rose-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Skull className="h-3.5 w-3.5" />
              1. Brutal Teardown ({audit.section_bs_factors?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('rewrites')}
              className={cn(
                'pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors',
                activeTab === 'rewrites'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              2. PAR Rewrites ({audit.bullet_rewrites?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('reality')}
              className={cn(
                'pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors',
                activeTab === 'reality'
                  ? 'border-purple-500 text-purple-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Target className="h-3.5 w-3.5" />
              3. Competitive Reality
            </button>
          </div>

          {/* Tab Content */}
          <CardContent className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* TAB 1: BRUTAL TEARDOWN */}
            {activeTab === 'teardown' && (
              <div className="space-y-5 animate-fade-in">
                {/* Critical Flaws & ATS Red Flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Flaws */}
                  <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-950/20 space-y-2">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                      Critical Flaws & Vague Claims
                    </span>
                    <ul className="space-y-1.5">
                      {audit.critical_flaws?.map((flaw, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-rose-200/90 flex items-start gap-1.5"
                        >
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{flaw}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ATS Red Flags */}
                  <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-950/20 space-y-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                      ATS-Killing Red Flags
                    </span>
                    <ul className="space-y-1.5">
                      {audit.ats_red_flags?.map((flag, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-amber-200/90 flex items-start gap-1.5"
                        >
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section-by-Section BS Factor Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Section-by-Section BS Factor Breakdown
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {audit.section_bs_factors?.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border/40 bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-foreground">
                            {sec.section_name}
                          </span>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {sec.critique}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span className="text-[10px] text-muted-foreground font-mono">BS Rating:</span>
                          <Badge
                            variant="outline"
                            className={cn('text-xs font-bold font-mono px-2 py-0.5 border', getBsFactorColor(sec.bs_factor))}
                          >
                            {sec.bs_factor.toFixed(1)} / 10
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAR REWRITES */}
            {activeTab === 'rewrites' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">
                    Problem-Action-Result (PAR) Metric Bullet Reconstructions
                  </span>
                </div>

                {audit.bullet_rewrites?.map((rewrite, idx) => (
                  <div
                    key={idx}
                    className="border border-border/40 rounded-2xl overflow-hidden glass-card shadow-md"
                  >
                    <div className="bg-secondary/40 px-3.5 py-2 text-xs font-semibold flex items-center justify-between border-b border-border/30">
                      <div className="flex gap-2 items-center">
                        <span className="text-muted-foreground text-[10px]">Evidence Project:</span>
                        {rewrite.evidence_refs?.map((ref) => (
                          <Badge
                            key={ref}
                            variant="outline"
                            className="text-[10px] py-0 px-2 bg-indigo-500/15 text-indigo-300 border-indigo-500/20 font-mono"
                          >
                            {ref}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                        onClick={() => copyToClipboard(rewrite.suggested, idx)}
                      >
                        {copiedIdx === idx ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedIdx === idx ? 'Copied' : 'Copy PAR Bullet'}
                      </Button>
                    </div>

                    <div className="p-2 bg-slate-950/80 text-xs">
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
                      ) : (
                        <p className="p-2 text-emerald-300 font-mono text-xs">{rewrite.suggested}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: COMPETITIVE REALITY */}
            {activeTab === 'reality' && (
              <div className="space-y-5 animate-fade-in">
                {/* Market Benchmark Summary */}
                <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-950/20 space-y-2">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-purple-400" />
                    Market Benchmark Reality Check
                  </span>
                  <p className="text-xs text-purple-100/90 leading-relaxed">
                    {audit.competitive_analysis?.market_benchmark_summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Critical Differentiators */}
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 space-y-2.5">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Critical Differentiators to Emphasize
                    </span>
                    <ul className="space-y-2">
                      {audit.competitive_analysis?.critical_differentiators?.map((diff, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-emerald-100/90 flex items-start gap-1.5"
                        >
                          <ArrowRight className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Development Priorities */}
                  <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 space-y-2.5">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      Next Technical Priorities to Build
                    </span>
                    <ul className="space-y-2">
                      {audit.competitive_analysis?.development_priorities?.map((prio, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-indigo-100/90 flex items-start gap-1.5"
                        >
                          <ArrowRight className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{prio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </>
      ) : (
        /* Empty State */
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3 flex-1">
          <div className="p-4 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
            <Flame className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No Teardown Executed Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
            Click <strong className="text-rose-400">Run Destroyer Audit</strong> to subject this resume to a merciless 3-stage critique, calculate your overall BS Factor, optimize bullet points with PAR metrics, and recommend standout GitHub projects.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
