import React from 'react';
import { cn } from '@/lib/utils';

export function Separator({
  orientation = 'horizontal',
  label,
  className,
}: {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}) {
  if (label && orientation === 'horizontal') {
    return (
      <div className={cn('relative flex items-center justify-center my-4', className)}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/40" />
        </div>
        <span className="relative px-3 text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-slate-950/80 rounded-full border border-border/40">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border/40',
        orientation === 'horizontal' ? 'h-[1px] w-full my-4' : 'h-full w-[1px] mx-2',
        className
      )}
    />
  );
}
