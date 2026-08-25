import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-600/35 border border-indigo-500/30',
        destructive:
          'bg-rose-600 text-white shadow-md shadow-rose-600/25 hover:bg-rose-500 hover:shadow-rose-600/35 border border-rose-500/30',
        outline:
          'border border-border/60 bg-secondary/30 text-foreground hover:bg-secondary/70 hover:border-indigo-500/40 hover:text-foreground shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/30',
        ghost:
          'text-muted-foreground hover:bg-white/5 hover:text-foreground',
        link:
          'text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300 p-0 h-auto',
        glass:
          'glass-card text-foreground hover:bg-white/10 hover:border-indigo-500/40 shadow-glass',
        gradient:
          'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:opacity-95 hover:shadow-indigo-500/45 border border-white/15',
        success:
          'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 border border-emerald-500/30',
      },
      size: {
        default: 'h-10 px-4 py-2 text-xs',
        xs: 'h-7 px-2.5 text-[11px] rounded-lg gap-1',
        sm: 'h-8 px-3 text-xs rounded-xl gap-1.5',
        lg: 'h-11 px-6 text-sm rounded-xl gap-2 font-bold',
        icon: 'h-9 w-9 rounded-xl',
        'icon-sm': 'h-7 w-7 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, icon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
