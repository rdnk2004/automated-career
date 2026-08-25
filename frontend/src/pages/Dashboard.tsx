import { useState } from 'react';
import { useCareerScore, useRefreshCareerScore } from '@/hooks/useAnalysis';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/hooks/useToast';
import { CareerScoreCard } from '@/components/dashboard/CareerScoreCard';
import { ActionsList } from '@/components/dashboard/ActionsList';
import { ScoreTrendChart } from '@/components/dashboard/ScoreTrendChart';
import { MetricCardSkeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  RefreshCw,
  Target,
  Rocket,
  Linkedin,
  Github,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { targetRole, setTargetRole } = useSettingsStore();
  const [roleInput, setRoleInput] = useState(targetRole);
  const { data: score, isLoading } = useCareerScore(targetRole);
  const { mutate: refreshScore, isPending: isRefreshing } = useRefreshCareerScore();

  const handleAudit = () => {
    const roleToUse = roleInput.trim() || targetRole;
    if (roleToUse !== targetRole) {
      setTargetRole(roleToUse);
    }
    toast.ai('Synthesizing Career Readiness...', `Evaluating LinkedIn, GitHub, and Indeed signals for ${roleToUse}`);
    refreshScore(roleToUse, {
      onSuccess: () => toast.success('Career Score Snapshot updated successfully!'),
      onError: (err: any) => toast.error('Audit failed', err?.message || 'Verify Gemini API Key configuration'),
    });
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Executive Welcome Hero Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/20 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Career Intelligence Engine Online
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-white">
              Welcome back, <span className="gradient-text">RDNK</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Your self-hosted AI agent is continually evaluating your LinkedIn profile, GitHub repositories, and live job market signals.
            </p>
          </div>

          {/* Quick Controls Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-2xl bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 rounded-xl border border-border/40">
              <Target className="h-4 w-4 text-indigo-400 shrink-0" />
              <Input
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
                placeholder="e.g. AI Engineer"
                className="h-7 w-44 bg-transparent border-0 p-0 text-xs font-medium focus-visible:ring-0 text-foreground"
              />
            </div>
            <Button
              onClick={handleAudit}
              disabled={isRefreshing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-5 h-10 text-xs font-semibold transition-all gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Analyzing Engine...' : 'Run Audit'}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state with Skeletons */}
      {isLoading || isRefreshing ? (
        <div className="space-y-8 animate-fade-in">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </div>
      ) : !score ? (
        /* Empty State */
        <div className="glass-card rounded-3xl p-12 sm:p-16 text-center text-muted-foreground border border-dashed border-border/60 max-w-2xl mx-auto space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-glow">
            <Rocket className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-heading text-foreground">
              No Career Score Snapshot Yet
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Click <span className="text-indigo-400 font-semibold">"Run Audit"</span> above to trigger Gemini 3.6 Flash to synthesize your LinkedIn profile, GitHub repositories, and live Indeed JDs into your first career scorecard.
            </p>
          </div>
          <Button
            onClick={handleAudit}
            disabled={isRefreshing}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-6 h-11 text-xs font-bold gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Career Analysis
          </Button>
        </div>
      ) : (
        /* Populated Dashboard Content */
        <div className="space-y-8 animate-slide-up">
          {/* 4 Executive Metric Score Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <CareerScoreCard title="LinkedIn Profile" score={score.linkedin} delta={6} />
            <CareerScoreCard title="GitHub Repos Health" score={score.github} delta={4} />
            <CareerScoreCard title="Resume Market Match" score={score.resume} delta={8} />
            <CareerScoreCard title="Overall Market Readiness" score={score.overall} delta={5} />
          </div>

          {/* Charts & Priority Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ScoreTrendChart currentScore={score.overall} />
            <ActionsList actions={score.weekly_actions} />
          </div>

          {/* Studio Quick Launchpad Cards */}
          <div className="pt-2">
            <div className="mb-4">
              <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Specialized Studio Workspaces
              </h3>
              <p className="text-xs text-muted-foreground">Jump into focused studios to resolve keyword gaps and security issues</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Link
                to="/linkedin"
                className="p-5 rounded-2xl glass-card glass-card-hover border border-border/40 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Linkedin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-heading text-foreground group-hover:text-indigo-300 transition-colors">
                      LinkedIn Studio
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Section scoring & bullet rewrites</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                to="/github"
                className="p-5 rounded-2xl glass-card glass-card-hover border border-border/40 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-heading text-foreground group-hover:text-indigo-300 transition-colors">
                      GitHub Inspector
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Security audit & README generator</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <Link
                to="/resume"
                className="p-5 rounded-2xl glass-card glass-card-hover border border-border/40 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-heading text-foreground group-hover:text-indigo-300 transition-colors">
                      Resume Matcher
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Live JD scraping & ATS PDF generator</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
