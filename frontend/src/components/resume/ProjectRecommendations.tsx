import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecommendedProject } from '@/types/resume';
import { toast } from '@/hooks/useToast';
import {
  FolderGit2,
  ExternalLink,
  Copy,
  Check,
  PlusCircle,
  Sparkles,
  Star,
  Layers,
  Flame,
} from 'lucide-react';

interface ProjectRecommendationsProps {
  projects?: RecommendedProject[];
  targetRole: string;
  onInsertBullets?: (bullets: string[]) => void;
}

export function ProjectRecommendations({
  projects = [],
  targetRole,
  onInsertBullets,
}: ProjectRecommendationsProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!projects || projects.length === 0) {
    return (
      <Card className="glass-card border-border/40 shadow-xl rounded-2xl p-5 border-dashed text-center">
        <div className="flex flex-col items-center justify-center space-y-2 py-4">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">GitHub Project Recommendations</p>
          <p className="text-[11px] text-muted-foreground max-w-sm">
            Run &quot;The Resume Destroyer&quot; analysis above to automatically evaluate your 28 public and collaborated repositories and recommend the highest-impact projects for <span className="font-semibold text-indigo-300">{targetRole}</span>.
          </p>
        </div>
      </Card>
    );
  }

  const handleCopyBullets = (bullets: string[], idx: number) => {
    const text = bullets.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Project Bullets Copied', 'Ready to paste into your resume');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleInsert = (bullets: string[]) => {
    if (onInsertBullets) {
      onInsertBullets(bullets);
      toast.success('Project Bullets Inserted into Resume!');
    }
  };

  return (
    <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden animate-fade-in">
      <CardHeader className="pb-3 border-b border-border/30 bg-secondary/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
              <FolderGit2 className="h-4 w-4" />
            </div>
            Featured Project Recommendations ({projects.length})
          </CardTitle>

          <Badge
            variant="outline"
            className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20 font-mono self-start sm:self-auto gap-1"
          >
            <Flame className="h-3 w-3 text-amber-400" />
            Tailored for {targetRole}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {projects.map((proj, idx) => (
          <div
            key={proj.repo_full_name || idx}
            className="border border-border/40 rounded-2xl overflow-hidden glass-card shadow-md transition-all hover:border-purple-500/30"
          >
            {/* Project Header */}
            <div className="bg-secondary/40 px-4 py-3 border-b border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-heading text-foreground">
                  {proj.name || proj.repo_full_name}
                </span>

                {proj.stars > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20 font-mono gap-0.5"
                  >
                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                    {proj.stars}
                  </Badge>
                )}

                {proj.html_url && (
                  <a
                    href={proj.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleCopyBullets(proj.suggested_bullets, idx)}
                  className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                >
                  {copiedIdx === idx ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedIdx === idx ? 'Copied' : 'Copy Bullets'}
                </Button>

                {onInsertBullets && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleInsert(proj.suggested_bullets)}
                    className="h-7 text-[11px] px-2.5 rounded-lg border-purple-500/30 text-purple-300 hover:bg-purple-500/10 font-semibold gap-1"
                  >
                    <PlusCircle className="h-3 w-3" />
                    Insert
                  </Button>
                )}
              </div>
            </div>

            {/* Match Rationale */}
            <div className="p-3.5 space-y-3 bg-slate-950/60 text-xs">
              <div className="flex items-start gap-2 bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/15">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-200/90 leading-relaxed">
                  <span className="font-semibold text-indigo-300">Why recruiters care: </span>
                  {proj.match_rationale}
                </p>
              </div>

              {/* Tech Stack */}
              {proj.key_technologies && proj.key_technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Tech:
                  </span>
                  {proj.key_technologies.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[10px] py-0 px-2 bg-secondary/80 text-foreground border-border/40 font-mono"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Suggested PAR Bullets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Layers className="h-3 w-3 text-purple-400" />
                  Metric-Driven PAR Bullets (Ready to Use):
                </span>
                <ul className="space-y-1.5 pl-2">
                  {proj.suggested_bullets.map((b, bIdx) => (
                    <li
                      key={bIdx}
                      className="text-[11px] font-mono text-muted-foreground leading-relaxed flex items-start gap-1.5"
                    >
                      <span className="text-purple-400 font-bold">•</span>
                      <span className="text-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
