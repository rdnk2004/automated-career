import { useCareerScore, useRefreshCareerScore } from '@/hooks/useAnalysis';
import { useSettingsStore } from '@/stores/settingsStore';
import { CareerScoreCard } from '@/components/dashboard/CareerScoreCard';
import { ActionsList } from '@/components/dashboard/ActionsList';
import { ScoreTrendChart } from '@/components/dashboard/ScoreTrendChart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { targetRole, setTargetRole } = useSettingsStore();
  const { data: score } = useCareerScore(targetRole);
  const { mutate: refreshScore, isPending: isRefreshing } = useRefreshCareerScore();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Target Role:</label>
          <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-64" />
          <Button onClick={() => refreshScore(targetRole)} disabled={isRefreshing}>
            {isRefreshing ? 'Analyzing...' : 'Refresh Scores'}
          </Button>
        </div>
      </div>

      {!score ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No career score data yet.</p>
          <p className="text-sm mt-2">Click "Refresh Scores" to generate your first AI-powered career analysis.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CareerScoreCard title="LinkedIn Score" score={score.linkedin} />
            <CareerScoreCard title="GitHub Health" score={score.github} />
            <CareerScoreCard title="Resume Match" score={score.resume} />
            <CareerScoreCard title="Overall Readiness" score={score.overall} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ScoreTrendChart />
            <ActionsList actions={score.weekly_actions} />
          </div>
        </>
      )}
    </div>
  );
}
