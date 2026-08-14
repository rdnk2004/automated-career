import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Linkedin, Github, FileText, Award, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CareerScoreCardProps {
  title: string;
  score: number;
  subtitle?: string;
}

export function CareerScoreCard({ title, score }: CareerScoreCardProps) {
  // Score status calculations
  const getStatus = (val: number) => {
    if (val >= 80) return { label: 'Optimal', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', stroke: '#34d399', icon: CheckCircle2 };
    if (val >= 60) return { label: 'Good', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', stroke: '#818cf8', icon: TrendingUp };
    return { label: 'Needs Action', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', stroke: '#fbbf24', icon: AlertCircle };
  };

  const getDomainIcon = (t: string) => {
    if (t.toLowerCase().includes('linkedin')) return Linkedin;
    if (t.toLowerCase().includes('github')) return Github;
    if (t.toLowerCase().includes('resume')) return FileText;
    return Award;
  };

  const status = getStatus(score);
  const IconComponent = getDomainIcon(title);
  const StatusIcon = status.icon;

  // SVG ring calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="glass-card glass-card-hover border-border/50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none"></div>
      
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <IconComponent className="h-3.5 w-3.5" />
          </div>
          {title}
        </CardTitle>
        <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1", status.bg, status.color)}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-extrabold font-heading tracking-tight text-foreground flex items-baseline gap-1">
              {score}
              <span className="text-xs font-medium text-muted-foreground font-sans">/100</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {score >= 80 ? 'Market aligned' : score >= 60 ? 'Minor keyword gaps' : 'Action recommended'}
            </p>
          </div>

          {/* SVG Radial Progress Circle */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-secondary/60"
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
            <span className="absolute text-xs font-bold font-heading text-foreground">
              {score}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
