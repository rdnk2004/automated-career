import { useCareerScore, useRefreshCareerScore } from '@/hooks/useAnalysis';
import { useSettingsStore } from '@/stores/settingsStore';
import { CareerScoreCard } from '@/components/dashboard/CareerScoreCard';
import { ActionsList } from '@/components/dashboard/ActionsList';
import { ScoreTrendChart } from '@/components/dashboard/ScoreTrendChart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Target, Rocket } from 'lucide-react';

export default function Dashboard() {
  const { targetRole, setTargetRole } = useSettingsStore();
  const { data: score } = useCareerScore(targetRole);
  const { mutate: refreshScore, isPending: isRefreshing } = useRefreshCareerScore();

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Executive Welcome Hero Banner */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/20 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Career Intelligence Engine Online
            </div>
            <h1 className="text-3xl font-extrabold font-heading tracking-tight text-white">
              Welcome back, <span className="gradient-text">RDNK</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Your self-hosted AI agent is continually evaluating your LinkedIn profile, GitHub repositories, and live market job listings.
            </p>
          </div>

          {/* Quick Controls Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 rounded-xl border border-border/40">
              <Target className="h-4 w-4 text-indigo-400 shrink-0" />
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. AI Engineer"
                className="h-7 w-44 bg-transparent border-0 p-0 text-sm font-medium focus-visible:ring-0 text-foreground"
              />
            </div>
            <Button
              onClick={() => refreshScore(targetRole)}
              disabled={isRefreshing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-5 h-11 font-medium transition-all gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Analyzing Engine...' : 'Run Audit'}
            </Button>
          </div>
        </div>
      </div>

      {!score ? (
        <div className="glass-card rounded-3xl p-16 text-center text-muted-foreground border border-dashed border-border/60 max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Rocket className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading text-foreground">No Career Score Snapshot Yet</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Click <span className="text-indigo-400 font-semibold">"Run Audit"</span> above to trigger Gemini 2.5 Pro to synthesize your LinkedIn, GitHub, and job market signals into your first career score snapshot.
            </p>
          </div>
          <Button onClick={() => refreshScore(targetRole)} disabled={isRefreshing} className="mt-4">
            {isRefreshing ? 'Analyzing...' : 'Generate Career Analysis'}
          </Button>
        </div>
      ) : (
        <div className="space-y-8 animate-slide-up">
          {/* 4 Executive Metric Score Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <CareerScoreCard title="LinkedIn Profile" score={score.linkedin} />
            <CareerScoreCard title="GitHub Repos Health" score={score.github} />
            <CareerScoreCard title="Resume Market Match" score={score.resume} />
            <CareerScoreCard title="Overall Market Readiness" score={score.overall} />
          </div>

          {/* Charts & Priority Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ScoreTrendChart />
            <ActionsList actions={score.weekly_actions} />
          </div>
        </div>
      )}
    </div>
  );
}
