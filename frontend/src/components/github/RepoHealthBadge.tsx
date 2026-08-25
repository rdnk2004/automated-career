import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Trophy, Sparkles, HelpCircle, Code2 } from 'lucide-react';

export function RepoHealthBadge({
  score,
  tier,
}: {
  score?: number | null;
  tier?: string | null;
}) {
  if (score === undefined || score === null) {
    return (
      <Tooltip content="Not evaluated yet. Click 'Evaluate' to analyze resume-worthiness.">
        <Badge
          variant="outline"
          className="text-muted-foreground/70 border-border/40 font-mono text-[10px] bg-secondary/30 flex items-center gap-1 cursor-default select-none"
        >
          <HelpCircle className="h-3 w-3" />
          <span>Unassessed</span>
        </Badge>
      </Tooltip>
    );
  }

  const isTier1 = tier?.toLowerCase().includes('tier 1') || tier?.toLowerCase().includes('flagship') || score >= 85;
  const isTier2 = tier?.toLowerCase().includes('tier 2') || tier?.toLowerCase().includes('supporting') || score >= 65;

  let colorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  let Icon = Trophy;
  let tooltipText = `Resume Impact Score: ${score}/100. Flagship project with high technical depth and architectural complexity.`;

  if (!isTier1 && isTier2) {
    colorClass = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    Icon = Sparkles;
    tooltipText = `Resume Impact Score: ${score}/100. Strong supporting project demonstrating solid domain execution.`;
  } else if (!isTier1 && !isTier2) {
    colorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    Icon = Code2;
    tooltipText = `Resume Impact Score: ${score}/100. Auxiliary utility or practice script.`;
  }

  return (
    <Tooltip content={tooltipText}>
      <Badge
        variant="outline"
        className={cn(
          'font-mono text-xs font-bold px-2 py-0.5 border flex items-center gap-1.5 cursor-default select-none shadow-sm',
          colorClass
        )}
      >
        <Icon className="h-3 w-3 shrink-0" />
        <span>{score}%</span>
      </Badge>
    </Tooltip>
  );
}
