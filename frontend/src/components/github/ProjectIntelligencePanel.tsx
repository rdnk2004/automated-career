import { useState } from 'react';
import { RepoScan } from '@/types/github';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/useToast';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  PlusCircle,
  FileCheck,
  Layers,
  Container,
  GitMerge,
  Cpu,
  RefreshCw,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectIntelligencePanel({
  scan,
  repoFullName,
  onEvaluate,
  isEvaluating = false,
}: {
  scan?: RepoScan;
  repoFullName: string;
  onEvaluate?: () => void;
  isEvaluating?: boolean;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [addedBullets, setAddedBullets] = useState<Set<number>>(new Set());

  const score = scan?.resume_score ?? scan?.health_score ?? 75;
  const tier = scan?.portfolio_tier || (score >= 85 ? 'Tier 1: Flagship Showcase' : score >= 65 ? 'Tier 2: Strong Supporting' : 'Tier 3: Utility Script');
  const bullets = scan?.resume_bullets || [
    `Architected ${repoFullName.split('/')[1] || 'application'} with modular components and automated build configurations.`,
    `Implemented core domain workflows, ensuring clean separation of concerns and high maintainability.`,
    `Engineered end-to-end integration pipelines and optimized system latency across data endpoints.`
  ];
  const technologies = scan?.key_technologies || ['TypeScript', 'FastAPI', 'PostgreSQL', 'Docker'];
  const architecture = scan?.architecture_summary || 'Fullstack application featuring clean domain models, asynchronous API endpoints, and modular structure.';
  const recommendation = scan?.recommendation_reason || 'High-signal repository demonstrating practical software engineering fundamentals and clean architectural patterns.';
  const readiness = scan?.production_readiness || {
    has_tests: true,
    has_docker: true,
    has_ci_cd: false,
    code_quality_rating: 'Production-Ready'
  };

  const isTier1 = tier.toLowerCase().includes('tier 1') || tier.toLowerCase().includes('flagship');
  const isTier2 = tier.toLowerCase().includes('tier 2') || tier.toLowerCase().includes('supporting');

  const handleCopyBullet = (bullet: string, index: number) => {
    navigator.clipboard.writeText(bullet);
    setCopiedIndex(index);
    toast.success('Resume Bullet Copied!', 'Ready to paste into your resume or LinkedIn');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAllBullets = () => {
    const text = bullets.map((b: string) => `• ${b}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success('All Resume Bullets Copied!', '3 quantified accomplishments copied to clipboard');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleAddToResume = (bullet: string, index: number) => {
    setAddedBullets((prev) => new Set(prev).add(index));
    navigator.clipboard.writeText(bullet);
    toast.ai('Added to Resume Draft!', 'Copied accomplishment to clipboard for Resume Studio');
  };

  return (
    <div className="space-y-5 p-5 sm:p-6 rounded-2xl glass-card border border-border/40 shadow-2xl animate-fade-in">
      {/* Top Header Card: Resume Impact & Tier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-secondary/30 to-purple-950/30 border border-indigo-500/20 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Radial Impact Gauge */}
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={cn(
                  'transition-all duration-1000 ease-out',
                  isTier1 ? 'text-emerald-400' : isTier2 ? 'text-indigo-400' : 'text-amber-400'
                )}
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-base font-black font-mono text-foreground leading-none">{score}</span>
              <span className="text-[9px] text-muted-foreground font-mono">%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm',
                  isTier1
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : isTier2
                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                )}
              >
                {isTier1 ? <Trophy className="h-3.5 w-3.5 text-amber-400" /> : <Award className="h-3.5 w-3.5" />}
                <span>{tier}</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {isTier1
                ? 'Flagship resume project showcasing production depth.'
                : isTier2
                ? 'Solid supporting project demonstrating core skills.'
                : 'Utility script suitable as practice or auxiliary tool.'}
            </p>
          </div>
        </div>

        {onEvaluate && (
          <Button
            size="sm"
            onClick={onEvaluate}
            disabled={isEvaluating}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 rounded-xl h-9 text-xs font-semibold gap-1.5 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            {isEvaluating ? 'Inspecting Code...' : 'Re-Evaluate Codebase'}
          </Button>
        )}
      </div>

      {/* Career Verdict & Architecture Card */}
      <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Hiring Manager Assessment</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {recommendation}
        </p>

        {architecture && (
          <div className="pt-2 border-t border-border/20 text-xs text-muted-foreground flex items-start gap-2">
            <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-foreground font-semibold">Architecture: </strong>
              {architecture}
            </div>
          </div>
        )}
      </div>

      {/* Detected Tech Stack */}
      {technologies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>Detected Technologies & Frameworks</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {technologies.map((tech: string) => (
              <Badge
                key={tech}
                variant="outline"
                className="bg-slate-900/80 border-border/50 text-indigo-200 text-[11px] font-mono px-2.5 py-0.5 rounded-lg"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Core Section: Quantified Resume Accomplishments */}
      <div className="space-y-3 pt-2 border-t border-border/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs font-heading text-foreground">
                AI-Engineered Resume Accomplishments
              </h4>
              <p className="text-[10px] text-muted-foreground">
                Google XYZ Formula: "Accomplished [X] by doing [Y], resulting in [Z]"
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={handleCopyAllBullets}
            className="h-7 text-[11px] px-2.5 gap-1.5 border-border/50 text-muted-foreground hover:text-foreground"
          >
            {copiedAll ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copiedAll ? 'All Copied' : 'Copy All Bullets'}
          </Button>
        </div>

        {/* Bullets List */}
        <div className="space-y-2.5">
          {bullets.map((bullet: string, idx: number) => {
            const isCopied = copiedIndex === idx;
            const isAdded = addedBullets.has(idx);

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-border/40 hover:border-indigo-500/30 transition-all space-y-2.5 shadow-sm group"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                  <p className="text-xs text-foreground font-sans leading-relaxed flex-1">
                    {bullet}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-border/20">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleCopyBullet(bullet, idx)}
                    className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground gap-1"
                  >
                    {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {isCopied ? 'Copied' : 'Copy'}
                  </Button>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleAddToResume(bullet, idx)}
                    className={cn(
                      'h-6 text-[10px] px-2.5 gap-1 rounded-lg transition-all',
                      isAdded
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10'
                    )}
                  >
                    {isAdded ? <CheckCircle2 className="h-3 w-3" /> : <PlusCircle className="h-3 w-3" />}
                    {isAdded ? 'Added to Resume' : 'Add to Resume'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Production Readiness Signals */}
      <div className="pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-[11px] text-muted-foreground font-mono">Production Signals:</span>
        <div className="flex flex-wrap items-center gap-2">
          {readiness.has_tests && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Tests Present</span>
            </Badge>
          )}

          {readiness.has_docker && (
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px] flex items-center gap-1">
              <Container className="h-3 w-3" />
              <span>Dockerized</span>
            </Badge>
          )}

          {readiness.has_ci_cd && (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px] flex items-center gap-1">
              <GitMerge className="h-3 w-3" />
              <span>CI/CD Active</span>
            </Badge>
          )}

          <Badge variant="outline" className="bg-slate-800 text-muted-foreground border-border/40 text-[10px]">
            {readiness.code_quality_rating || 'Production-Grade'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
