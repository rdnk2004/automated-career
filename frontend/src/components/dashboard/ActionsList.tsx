import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  CheckCircle,
  Circle,
  Sparkles,
  Zap,
  ArrowRight,
  PartyPopper,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActionsList({ actions = [] }: { actions: string[] }) {
  const { completedWeeklyActions, toggleWeeklyAction, clearCompletedWeeklyActions } = useSettingsStore();

  const getActionMetadata = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('linkedin') || t.includes('profile') || t.includes('headline') || t.includes('about')) {
      return {
        label: 'LinkedIn Studio',
        color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        href: '/linkedin',
        actionText: 'Review Profile',
      };
    }
    if (t.includes('github') || t.includes('readme') || t.includes('secret') || t.includes('repo')) {
      return {
        label: 'GitHub Portfolio',
        color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        href: '/github',
        actionText: 'Inspect Repos',
      };
    }
    return {
      label: 'Resume Matcher',
      color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      href: '/resume',
      actionText: 'Match Keywords',
    };
  };

  const allDone = actions.length > 0 && actions.every((_, i) => completedWeeklyActions.includes(i));

  return (
    <Card className="col-span-2 glass-card border-border/50 shadow-xl overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30">
          <div>
            <CardTitle className="text-base font-bold font-heading flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="h-4 w-4" />
              </div>
              High-Impact Actions This Week
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synthesized by AI intelligence engine to maximize career market readiness
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-semibold px-2.5 py-0.5 border',
                allDone
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
              )}
            >
              {completedWeeklyActions.filter((i) => i < actions.length).length} / {actions.length} Done
            </Badge>

            {completedWeeklyActions.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={clearCompletedWeeklyActions}
                className="text-[10px] text-muted-foreground hover:text-foreground h-6 px-1.5"
                title="Reset completed actions"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {allDone && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs animate-pop-in">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <PartyPopper className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="font-bold block text-emerald-200">All weekly priorities completed!</span>
                <span className="text-emerald-400/80 text-[11px]">
                  Your profile and portfolio are primed for executive opportunities.
                </span>
              </div>
            </div>
          )}

          {actions.map((action, i) => {
            const isDone = completedWeeklyActions.includes(i);
            const meta = getActionMetadata(action);

            return (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 group relative',
                  isDone
                    ? 'bg-secondary/20 border-border/30 opacity-60 text-muted-foreground'
                    : 'bg-secondary/40 border-border/50 hover:bg-secondary/70 hover:border-indigo-500/35 hover:shadow-md'
                )}
              >
                <button
                  onClick={() => toggleWeeklyAction(i)}
                  aria-label={isDone ? 'Mark uncompleted' : 'Mark completed'}
                  className="mt-0.5 text-muted-foreground hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="h-5 w-5 stroke-[1.75]" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider', meta.color)}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Priority #{i + 1}
                      </span>
                    </div>

                    <Link
                      to={meta.href}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors opacity-90 group-hover:opacity-100"
                    >
                      <span>{meta.actionText}</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <p className={cn('text-xs font-medium leading-relaxed', isDone ? 'line-through text-muted-foreground' : 'text-foreground')}>
                    {action}
                  </p>
                </div>
              </div>
            );
          })}

          {actions.length === 0 && (
            <div className="py-10 text-center text-muted-foreground space-y-2">
              <Sparkles className="h-8 w-8 text-indigo-400/50 mx-auto animate-pulse" />
              <p className="text-xs font-medium">No actions generated yet. Run an audit above to generate weekly actions.</p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
