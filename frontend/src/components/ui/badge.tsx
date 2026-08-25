import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all focus:outline-none select-none',
  {
    variants: {
      variant: {
        default:
          'border-indigo-500/30 bg-indigo-500/15 text-indigo-300 shadow-sm',
        secondary:
          'border-border/50 bg-secondary/70 text-secondary-foreground',
        destructive:
          'border-rose-500/30 bg-rose-500/15 text-rose-400',
        outline:
          'border-border/60 text-muted-foreground',
        success:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-sm',
        warning:
          'border-amber-500/30 bg-amber-500/15 text-amber-400 shadow-sm',
        info:
          'border-sky-500/30 bg-sky-500/15 text-sky-400 shadow-sm',
        ai:
          'border-indigo-500/40 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 shadow-glow',
        purple:
          'border-purple-500/30 bg-purple-500/15 text-purple-400',
        emerald:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

function Badge({ className, variant, dot = false, dotColor, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColor || (variant === 'success' || variant === 'emerald' ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400')
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
