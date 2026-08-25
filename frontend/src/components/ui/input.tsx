import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, rightElement, ...props }, ref) => {
    if (icon || rightElement) {
      return (
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-xl border border-border/50 bg-secondary/30 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 font-medium',
              icon && 'pl-10',
              rightElement && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-border/50 bg-secondary/30 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
