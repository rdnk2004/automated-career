import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Sparkles, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScoreHistory, useCareerMetrics } from '@/hooks/useAnalysis';
import { useSettingsStore } from '@/stores/settingsStore';

type TimeRange = '1W' | '1M' | '3M' | 'All';

interface SnapshotPoint {
  date: string;
  score: number;
  linkedin: number;
  github: number;
  resume: number;
}

const timeRangeDays: Record<TimeRange, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  'All': 365,
};

const baseSnapshots: Record<TimeRange, SnapshotPoint[]> = {
  '1W': [
    { date: 'Mon', score: 68, linkedin: 70, github: 65, resume: 70 },
    { date: 'Tue', score: 71, linkedin: 72, github: 68, resume: 74 },
    { date: 'Wed', score: 75, linkedin: 78, github: 70, resume: 78 },
    { date: 'Thu', score: 79, linkedin: 80, github: 76, resume: 82 },
    { date: 'Fri', score: 82, linkedin: 84, github: 80, resume: 83 },
    { date: 'Sat', score: 85, linkedin: 88, github: 82, resume: 86 },
    { date: 'Sun', score: 88, linkedin: 90, github: 85, resume: 89 },
  ],
  '1M': [
    { date: 'W1', score: 54, linkedin: 55, github: 50, resume: 58 },
    { date: 'W2', score: 63, linkedin: 65, github: 60, resume: 64 },
    { date: 'W3', score: 74, linkedin: 78, github: 70, resume: 75 },
    { date: 'W4', score: 88, linkedin: 90, github: 85, resume: 89 },
  ],
  '3M': [
    { date: 'Month 1', score: 48, linkedin: 50, github: 45, resume: 50 },
    { date: 'Month 2', score: 68, linkedin: 72, github: 64, resume: 68 },
    { date: 'Month 3', score: 88, linkedin: 90, github: 85, resume: 89 },
  ],
  'All': [
    { date: 'Initial', score: 42, linkedin: 45, github: 40, resume: 40 },
    { date: 'Month 1', score: 58, linkedin: 62, github: 55, resume: 58 },
    { date: 'Month 2', score: 74, linkedin: 78, github: 70, resume: 75 },
    { date: 'Current', score: 88, linkedin: 90, github: 85, resume: 89 },
  ],
};

export function ScoreTrendChart({ currentScore }: { currentScore?: number }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const { targetRole } = useSettingsStore();

  const days = timeRangeDays[timeRange];
  const { data: history, isLoading } = useScoreHistory(targetRole, days);
  const { data: metrics } = useCareerMetrics(targetRole);

  const chartData = useMemo(() => {
    if (history?.snapshots && history.snapshots.length >= 2) {
      return history.snapshots.map((s) => {
        const d = new Date(s.snapshotted_at);
        const dateStr =
          days <= 7
            ? d.toLocaleDateString(undefined, { weekday: 'short' })
            : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        return {
          date: dateStr,
          score: s.overall_score,
          linkedin: s.linkedin_score,
          github: s.github_score,
          resume: s.resume_match_score,
        };
      });
    }

    const fallback = baseSnapshots[timeRange];
    if (currentScore !== undefined && fallback.length > 0) {
      return fallback.map((pt, i) =>
        i === fallback.length - 1 ? { ...pt, score: currentScore } : pt
      );
    }
    return fallback;
  }, [history, timeRange, currentScore, days]);

  const hasRealHistory = (history?.snapshots?.length ?? 0) >= 2;
  const growthDelta = metrics?.delta_7d ?? +6;

  return (
    <Card className="glass-card border-border/40 shadow-xl overflow-hidden rounded-3xl">
      <CardHeader className="pb-2 border-b border-border/30 bg-secondary/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
              Career Readiness Trajectory
            </CardTitle>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Composite readiness score progression over time
              </p>
              {hasRealHistory ? (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30 gap-1 py-0 px-2 font-mono">
                  <Activity className="h-2.5 w-2.5" />
                  Live History
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/30 gap-1 py-0 px-2 font-mono">
                  <Sparkles className="h-2.5 w-2.5" />
                  Baseline Mode
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {growthDelta !== 0 && (
              <Badge variant="success" className="text-xs font-bold gap-1 px-2.5 py-0.5 shadow-sm">
                <TrendingUp className="h-3 w-3" />
                {growthDelta > 0 ? `+${growthDelta}` : growthDelta} pts (7d)
              </Badge>
            )}

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl border border-border/40 text-xs">
              {(['1W', '1M', '3M', 'All'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-semibold transition-all select-none',
                    timeRange === range
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-6">
        <div className="h-[260px] w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-mono">
              Loading trajectory telemetry...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />

                <XAxis
                  dataKey="date"
                  stroke="rgba(255, 255, 255, 0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />

                <YAxis
                  domain={[0, 100]}
                  stroke="rgba(255, 255, 255, 0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  ticks={[0, 25, 50, 75, 100]}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3.5 rounded-2xl glass-panel border border-indigo-500/30 shadow-2xl space-y-1.5 min-w-[170px] backdrop-blur-xl">
                          <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                            <span className="text-[11px] font-mono text-muted-foreground">{data.date}</span>
                            <span className="text-xs font-bold text-indigo-300 font-mono">
                              {data.score}/100 Overall
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px] pt-0.5">
                            <div className="flex justify-between text-muted-foreground">
                              <span>LinkedIn:</span>
                              <span className="font-semibold text-foreground">{data.linkedin}%</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>GitHub:</span>
                              <span className="font-semibold text-foreground">{data.github}%</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Resume:</span>
                              <span className="font-semibold text-foreground">{data.resume}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <ReferenceLine
                  y={85}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Interview Ready (85%)',
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreAreaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
