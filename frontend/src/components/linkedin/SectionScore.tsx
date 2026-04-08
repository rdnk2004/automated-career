import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SectionScore({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  
  let colorClass = 'bg-green-500 hover:bg-green-600';
  if (score < 50) colorClass = 'bg-red-500 hover:bg-red-600';
  else if (score <= 75) colorClass = 'bg-amber-500 hover:bg-amber-600';
  
  return (
    <Badge className={cn("ml-2 text-white border-transparent", colorClass)}>
      {score}/100
    </Badge>
  );
}
