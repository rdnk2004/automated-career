import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl bg-secondary/60 shimmer-bg animate-pulse',
        className
      )}
      {...props}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 border border-border/40 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-5 border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
      <div className="p-4 bg-secondary/40 border-b border-border/40 flex items-center justify-between gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center justify-between gap-4 py-2">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton key={cIdx} className="h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiffSkeleton() {
  return (
    <div className="glass-card rounded-2xl border border-border/40 overflow-hidden space-y-3 p-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
      <div className="space-y-2 p-3 bg-slate-950/70 rounded-xl">
        <Skeleton className="h-4 w-full bg-rose-500/10" />
        <Skeleton className="h-4 w-5/6 bg-emerald-500/10" />
        <Skeleton className="h-4 w-4/6 bg-emerald-500/10" />
      </div>
    </div>
  );
}
