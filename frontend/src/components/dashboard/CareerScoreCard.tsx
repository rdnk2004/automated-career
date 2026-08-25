import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Linkedin,
  Github,
  FileText,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CareerScoreCardProps {
  title: string;
  score: number;
  delta?: number;
}

export function CareerScoreCard({ title, score, delta = 4 }: CareerScoreCardProps) {
  // Score status calculations
  const getStatus = (val: number) => {
    if (val >= 80)
      return {
        label: 'Optimal',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        stroke: '#10b981',
        glow: 'shadow-glow-emerald',
        icon: CheckCircle2,
        desc: 'Strong market keyword alignment & flagship project evidence',
      };
    if (val >= 60)
      return {
        label: 'Good',
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
        stroke: '#818cf8',
        glow: 'shadow-glow',
        icon: TrendingUp,
        desc: 'Solid codebase with minor README or keyword optimizations available',
      };
    return {
      label: 'Action Needed',
      color: 'text-amber-400',
      bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      stroke: '#f59e0b',
      glow: 'shadow-glow-amber',
      icon: AlertCircle,
      desc: 'Action recommended: Evaluate repositories & align resume bullets',
    };
  };

  const getDomainConfig = (t: string) => {
    const lower = t.toLowerCase();
    if (lower.includes('linkedin')) {
      return {
        icon: Linkedin,
        href: '/linkedin',
        actionLabel: 'Open Studio',
        iconColor: 'text-blue-400',
        iconBg: 'bg-blue-500/10 border-blue-500/20',
      };
    }
    if (lower.includes('github') || lower.includes('portfolio')) {
      return {
        icon: Github,
        href: '/github',
        actionLabel: 'Evaluate Portfolio',
        iconColor: 'text-purple-400',
        iconBg: 'bg-purple-500/10 border-purple-500/20',
      };
    }
    if (lower.includes('resume')) {
      return {
        icon: FileText,
        href: '/resume',
        actionLabel: 'Match Keywords',
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      };
    }
    return {
      icon: Award,
      href: '/',
      actionLabel: 'Readiness Audit',
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    };
  };

  const status = getStatus(score);
  const domain = getDomainConfig(title);
  const IconComponent = domain.icon;
  const StatusIcon = status.icon;

  // SVG ring calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <Card className="glass-card glass-card-hover border-border/50 relative overflow-hidden group flex flex-col justify-between">
      {/* Subtle glowing corner light */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/15 transition-colors pointer-events-none" />

      <div>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <div className={cn('p-2 rounded-xl border', domain.iconBg, domain.iconColor)}>
              <IconComponent className="h-3.5 w-3.5" />
            </div>
            <span>{title}</span>
          </CardTitle>
          <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0.5 border flex items-center gap-1', status.bg)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </CardHeader>

        <CardContent className="pt-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-extrabold font-heading tracking-tight text-foreground flex items-baseline gap-1.5">
                {score}
                <span className="text-xs font-semibold text-muted-foreground font-sans">/ 100</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
                  +{delta} pts
                </span>
                <span className="text-[10px] text-muted-foreground">vs initial baseline</span>
              </div>
            </div>

            {/* Animated Radial SVG Progress Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-secondary/70"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={status.stroke}
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-xs font-extrabold font-heading text-foreground">
                {score}%
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed border-t border-border/30 pt-2.5">
            {status.desc}
          </p>
        </CardContent>
      </div>

      {domain.href !== '/' && (
        <div className="px-5 pb-4 pt-0">
          <Link
            to={domain.href}
            className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded-xl bg-secondary/40 hover:bg-secondary/80 border border-border/30 hover:border-indigo-500/40 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 group/link"
          >
            <span>{domain.actionLabel}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover/link:text-indigo-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </Card>
  );
}
