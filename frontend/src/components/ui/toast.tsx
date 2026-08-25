import React from 'react';
import { useToast } from '@/hooks/useToast';
import { ToastItem, ToastVariant } from '@/types/toast';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const variantConfig: Record<ToastVariant, {
  icon: React.ComponentType<{ className?: string }>;
  borderClass: string;
  badgeClass: string;
  iconColor: string;
  glowClass: string;
}> = {
  default: {
    icon: Info,
    borderClass: 'border-border/60 bg-slate-950/95 text-foreground',
    badgeClass: 'bg-secondary text-foreground',
    iconColor: 'text-indigo-400',
    glowClass: 'shadow-glass',
  },
  success: {
    icon: CheckCircle2,
    borderClass: 'border-emerald-500/30 bg-slate-950/95 text-foreground',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    iconColor: 'text-emerald-400',
    glowClass: 'shadow-glow-emerald',
  },
  error: {
    icon: AlertCircle,
    borderClass: 'border-rose-500/35 bg-slate-950/95 text-foreground',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    iconColor: 'text-rose-400',
    glowClass: 'shadow-glow-rose',
  },
  warning: {
    icon: AlertTriangle,
    borderClass: 'border-amber-500/30 bg-slate-950/95 text-foreground',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    iconColor: 'text-amber-400',
    glowClass: 'shadow-glow-amber',
  },
  info: {
    icon: Info,
    borderClass: 'border-indigo-500/30 bg-slate-950/95 text-foreground',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    iconColor: 'text-indigo-400',
    glowClass: 'shadow-glow',
  },
  ai: {
    icon: Sparkles,
    borderClass: 'border-indigo-500/40 bg-gradient-to-r from-slate-950/98 via-indigo-950/40 to-slate-950/98 text-foreground',
    badgeClass: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30',
    iconColor: 'text-indigo-400 animate-pulse',
    glowClass: 'shadow-glow-lg',
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const config = variantConfig[toast.variant || 'default'];
  const Icon = toast.icon || config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'group relative flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 backdrop-blur-2xl transition-all duration-300',
        'animate-slide-up shadow-2xl',
        config.borderClass,
        config.glowClass
      )}
    >
      <div className={cn('p-1.5 rounded-xl bg-white/5 shrink-0 border border-white/10 mt-0.5', config.iconColor)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        {toast.title && (
          <h4 className="text-xs font-semibold font-heading tracking-tight text-foreground flex items-center gap-2">
            {toast.title}
          </h4>
        )}
        {toast.description && (
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-sans break-words">
            {toast.description}
          </div>
        )}
        {toast.action && (
          <div className="mt-2.5">
            <button
              onClick={(e) => {
                toast.action?.onClick(e);
                onDismiss(toast.id);
              }}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
        className="text-muted-foreground/60 hover:text-foreground p-1 rounded-lg hover:bg-white/10 transition-all shrink-0 -mr-1 -mt-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div 
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
      ))}
    </div>
  );
}
