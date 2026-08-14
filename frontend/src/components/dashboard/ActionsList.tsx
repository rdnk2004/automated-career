import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActionsList({ actions }: { actions: string[] }) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const toggleComplete = (index: number) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getCategory = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('linkedin') || t.includes('profile') || t.includes('headline')) return { label: 'LinkedIn', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    if (t.includes('github') || t.includes('readme') || t.includes('secret') || t.includes('repo')) return { label: 'GitHub', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    return { label: 'Resume', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  };

  return (
    <Card className="col-span-2 glass-card border-border/50 shadow-xl overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold font-heading flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              High-Impact Actions This Week
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Synthesized by AI engine to boost career readiness</p>
          </div>
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs">
            {completed.size}/{actions.length} Done
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          {actions.map((action, i) => {
            const isDone = completed.has(i);
            const cat = getCategory(action);

            return (
              <div
                key={i}
                onClick={() => toggleComplete(i)}
                className={cn(
                  "flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group",
                  isDone
                    ? "bg-secondary/20 border-border/30 opacity-60 line-through text-muted-foreground"
                    : "bg-secondary/40 border-border/50 hover:bg-secondary/70 hover:border-indigo-500/30 hover:shadow-md"
                )}
              >
                <div className="mt-0.5 text-muted-foreground group-hover:text-indigo-400 transition-colors">
                  {isDone ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="h-5 w-5 stroke-[1.5]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider", cat.color)}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Priority #{i + 1}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {action}
                  </p>
                </div>
              </div>
            );
          })}

          {actions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground space-y-2">
              <Sparkles className="h-8 w-8 text-indigo-400/50 mx-auto" />
              <p className="text-sm">No pending actions. Your profiles are fully optimized!</p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
