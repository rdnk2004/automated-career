import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
export function CareerScoreCard({ title, score }: { title: string, score: number }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{score}/100</div></CardContent>
    </Card>
  );
}
