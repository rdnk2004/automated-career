import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export function RepoHealthBadge({ score }: { score?: number | null }) {
  if (score === undefined || score === null) {
    return (
      <Tooltip content="Not scanned yet. Click 'Scan Security' to audit this repo.">
        <Badge
          variant="outline"
          className="text-muted-foreground/70 border-border/40 font-mono text-[10px] bg-secondary/30 flex items-center gap-1 cursor-default select-none"
        >
          <HelpCircle className="h-3 w-3" />
          <span>Unscanned</span>
        </Badge>
      </Tooltip>
    );
  }

  let colorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  let label = 'Flawless';
  let Icon = CheckCircle2;
  let tooltipText = `Health Score: ${score}/100. Repository has README, no leaked credentials, and clean structure.`;

  if (score <= 50) {
    colorClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    label = 'Critical';
    Icon = ShieldAlert;
    tooltipText = `Health Score: ${score}/100. Action required: Potential leaked secrets or missing .gitignore/.env risk detected.`;
  } else if (score <= 75) {
    colorClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    label = 'Action Needed';
    Icon = AlertTriangle;
    tooltipText = `Health Score: ${score}/100. Missing README or low documentation quality.`;
  } else if (score < 90) {
    colorClass = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    label = 'Good';
    Icon = Sparkles;
    tooltipText = `Health Score: ${score}/100. Good quality, minor improvements suggested.`;
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
        <Icon className="h-3 w-3" />
        <span>{score}/100</span>
      </Badge>
    </Tooltip>
  );
}
