import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
export function ActionsList({ actions }: { actions: string[] }) {
  return (
    <Card className="col-span-2">
      <CardHeader><CardTitle>Top 3 Actions This Week</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {actions.map((action, i) => (
            <li key={i} className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5">{i+1}</Badge>
              <span className="text-sm">{action}</span>
            </li>
          ))}
          {actions.length === 0 && <p className="text-sm text-muted-foreground">No actions currently suggested.</p>}
        </ul>
      </CardContent>
    </Card>
  );
}
