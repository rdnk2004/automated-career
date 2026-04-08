import { Badge } from '@/components/ui/badge';
import { KeywordGap } from '@/types/analysis';

export function KeywordGapBadges({ gaps }: { gaps: KeywordGap[] }) {
  if (!gaps || gaps.length === 0) {
    return <p className="text-sm text-muted-foreground">No keyword gaps identified.</p>;
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {gaps.map((gap, i) => (
        <Badge key={i} variant="secondary" className="flex items-center gap-1">
          {gap.keyword}
          {gap.frequency && <span className="text-xs text-muted-foreground ml-1">({gap.frequency})</span>}
        </Badge>
      ))}
    </div>
  );
}
