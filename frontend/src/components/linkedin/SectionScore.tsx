import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export function SectionScore({ score, reasoning }: { score?: number; reasoning?: string }) {
  if (score === undefined || score === null) return null;

  let variant: 'success' | 'warning' | 'destructive' = 'success';
  let label = 'Optimal';
  let Icon = CheckCircle2;

  if (score < 60) {
    variant = 'destructive';
    label = 'Needs Action';
    Icon = AlertTriangle;
  } else if (score <= 75) {
    variant = 'warning';
    label = 'Moderate';
    Icon = TrendingUp;
  }

  const badgeEl = (
    <Badge
      variant={variant}
      className={cn(
        'font-mono text-[11px] font-bold px-2 py-0.5 border flex items-center gap-1 cursor-default select-none'
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{score}/100</span>
    </Badge>
  );

  if (reasoning) {
    return (
      <Tooltip content={<span className="max-w-xs">{reasoning}</span>}>
        {badgeEl}
      </Tooltip>
    );
  }

  return (
    <Tooltip content={`Section Quality Score: ${score}% (${label})`}>
      {badgeEl}
    </Tooltip>
  );
}
