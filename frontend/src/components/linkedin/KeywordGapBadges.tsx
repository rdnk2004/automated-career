import { Badge } from '@/components/ui/badge';
import { KeywordGap } from '@/types/analysis';

export function KeywordGapBadges({ gaps }: { gaps: (KeywordGap | string)[] }) {
  if (!gaps || gaps.length === 0) {
    return <p className="text-sm text-muted-foreground">No keyword gaps identified.</p>;
  }
  
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {gaps.map((gapItem, i) => {
        const keyword = typeof gapItem === 'string' ? gapItem : gapItem.keyword;
        const freq = typeof gapItem === 'object' ? gapItem.frequency : undefined;

        return (
          <Badge
            key={i}
            variant="outline"
            className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 px-3 py-1 text-xs font-medium transition-all"
          >
            <span>{keyword}</span>
            {freq && (
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full ml-1.5">
                {freq}x
              </span>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
