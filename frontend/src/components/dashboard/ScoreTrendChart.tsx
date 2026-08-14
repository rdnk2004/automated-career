import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const mockData = [
  { date: 'W1', score: 52 },
  { date: 'W2', score: 61 },
  { date: 'W3', score: 68 },
  { date: 'W4', score: 75 },
  { date: 'W5', score: 84 },
  { date: 'W6', score: 88 }
];

export function ScoreTrendChart() {
  return (
    <Card className="col-span-2 glass-card border-border/50 shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            Career Score Trajectory
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Historical progress over recent snapshot intervals</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          +36% Growth
        </div>
      </CardHeader>

      <CardContent className="h-[260px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                padding: '8px 12px',
                fontSize: '12px'
              }}
              formatter={(value: any) => [`${value} / 100`, 'Overall Score']}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#818cf8"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#scoreGradient)"
              dot={{ r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#0f172a' }}
              activeDot={{ r: 6, fill: '#a5b4fc', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
