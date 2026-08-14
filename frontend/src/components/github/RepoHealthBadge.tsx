import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function RepoHealthBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) {
    return <Badge variant="outline" className="text-muted-foreground/60 border-border/40 font-mono text-[10px]">Unscanned</Badge>;
  }
  
  let colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
  if (score <= 50) colorClass = 'bg-rose-500/15 text-rose-400 border-rose-500/25';
  else if (score <= 75) colorClass = 'bg-amber-500/15 text-amber-400 border-amber-500/25';
  
  return (
    <Badge variant="outline" className={cn("font-mono text-xs font-semibold px-2 py-0.5 border", colorClass)}>
      {score}/100
    </Badge>
  );
}
