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
import { TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeRange = '1W' | '1M' | '3M' | 'All';

interface SnapshotPoint {
  date: string;
  score: number;
  linkedin: number;
  github: number;
  resume: number;
}

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

  const chartData = useMemo(() => {
    const data = baseSnapshots[timeRange];
    if (currentScore && data.length > 0) {
      // Align last point to live currentScore
      const lastIdx = data.length - 1;
      const updated = [...data];
      updated[lastIdx] = {
        ...updated[lastIdx],
        score: currentScore,
      };
      return updated;
    }
    return data;
  }, [timeRange, currentScore]);

  const initialScore = chartData[0]?.score || 50;
  const latestScore = chartData[chartData.length - 1]?.score || 88;
  const growth = Math.round(((latestScore - initialScore) / initialScore) * 100);

  return (
    <Card className="col-span-2 glass-card border-border/50 shadow-xl overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 border-b border-border/30">
          <div>
            <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              Career Score Trajectory
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Historical progress & AI synthesis snapshots over time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs font-semibold px-2.5 py-1">
              +{growth}% Trajectory
            </Badge>

            {/* Time range pills */}
            <div className="flex items-center gap-1 p-1 bg-secondary/40 rounded-xl border border-border/40 text-[11px]">
              {(['1W', '1M', '3M', 'All'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-semibold transition-all select-none',
                    timeRange === range
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="h-[280px] pt-4 px-2 sm:px-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.06)" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                fontFamily="JetBrains Mono, monospace"
              />
              <ReferenceLine
                y={80}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{
                  value: 'Target Benchmark (80%)',
                  fill: '#34d399',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(13, 20, 38, 0.95)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '16px',
                  boxShadow: '0 12px 36px -5px rgba(0,0,0,0.6)',
                  padding: '10px 14px',
                  fontSize: '12px',
                  backdropFilter: 'blur(12px)',
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'score') return [`${value} / 100`, 'Overall Readiness'];
                  return [`${value}%`, name];
                }}
                labelStyle={{ fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#818cf8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#scoreAreaGradient)"
                dot={{ r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 6, fill: '#c7d2fe', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </div>

      <div className="px-6 py-3 border-t border-border/30 bg-secondary/20 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Optimal threshold is 80+ for executive & staff candidate readiness
        </span>
        <span className="font-mono text-foreground font-semibold">
          Current: {latestScore} / 100
        </span>
      </div>
    </Card>
  );
}
