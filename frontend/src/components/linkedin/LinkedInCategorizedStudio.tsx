import { useState } from 'react';
import { SuggestionSet } from '@/types/analysis';
import { UserProfile } from '@/types/profile';
import { useProfileStore } from '@/stores/profileStore';
import { toast } from '@/hooks/useToast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  User,
  FolderGit2,
  TrendingUp,
  Target,
  FileText,
  Copy,
  Check,
  Award,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Zap,
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  PlusCircle,
  Briefcase,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedInCategorizedStudioProps {
  suggestions: SuggestionSet | null;
  isLoading: boolean;
  profile: UserProfile | null;
  targetRole: string;
}

export function LinkedInCategorizedStudio({
  suggestions,
  isLoading,
  profile,
  targetRole,
}: LinkedInCategorizedStudioProps) {
  const [activeCategory, setActiveCategory] = useState<
    'components' | 'projects' | 'strategy' | 'content'
  >('components');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { setDraftContent } = useProfileStore();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to Clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyToDraft = (sectionType: string, newContent: any, key: string) => {
    if (!profile?.sections) {
      handleCopy(typeof newContent === 'string' ? newContent : JSON.stringify(newContent), key);
      return;
    }

    const sec = profile.sections.find(
      (s) => s.section_type.toLowerCase() === sectionType.toLowerCase()
    );

    if (sec) {
      setDraftContent(sec.id, {
        ...sec.content,
        suggestedRewrite: newContent,
      });
      setCopiedKey(key);
      toast.success(
        'Applied to Draft Editor',
        `Staged new content in ${sec.title || sec.section_type}`
      );
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      handleCopy(typeof newContent === 'string' ? newContent : JSON.stringify(newContent), key);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 shadow-2xl rounded-2xl p-8 text-center space-y-4 flex flex-col items-center justify-center h-full">
        <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse shadow-glow">
          <Sparkles className="h-8 w-8 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold font-heading text-foreground">
            Gemini 3.6 Flash Categorized LinkedIn Analysis...
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Evaluating headlines, narrative about section, experience metrics, GitHub project injections, and 30/60/90 roadmap for {targetRole}.
          </p>
        </div>
      </Card>
    );
  }

  if (!suggestions) {
    return (
      <Card className="glass-card border-border/40 shadow-2xl rounded-2xl p-8 text-center space-y-3 flex flex-col items-center justify-center h-full">
        <div className="p-4 rounded-3xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
          <Target className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-bold text-foreground">No Analysis Generated Yet</h3>
        <p className="text-xs text-muted-foreground max-w-md">
          Click <strong className="text-indigo-400">Run Analysis</strong> above to execute the 4-pillar LinkedIn optimization across profile components, GitHub project recommendations, keyword strategy, and content engine.
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/40 shadow-2xl rounded-2xl overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Category Navigation Bar */}
      <div className="flex border-b border-border/40 bg-secondary/30 px-3 pt-2 gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveCategory('components')}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 shrink-0',
            activeCategory === 'components'
              ? 'border-indigo-500 text-indigo-400 bg-secondary/60 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
          )}
        >
          <User className="h-3.5 w-3.5" />
          1. Profile Components
        </button>

        <button
          onClick={() => setActiveCategory('projects')}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 shrink-0',
            activeCategory === 'projects'
              ? 'border-purple-500 text-purple-400 bg-secondary/60 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
          )}
        >
          <FolderGit2 className="h-3.5 w-3.5" />
          2. GitHub Project Injections
          {suggestions.recommended_projects_to_add?.length ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {suggestions.recommended_projects_to_add.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveCategory('strategy')}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 shrink-0',
            activeCategory === 'strategy'
              ? 'border-emerald-500 text-emerald-400 bg-secondary/60 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          3. Strategy & 30/60/90
        </button>

        <button
          onClick={() => setActiveCategory('content')}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 shrink-0',
            activeCategory === 'content'
              ? 'border-amber-500 text-amber-400 bg-secondary/60 font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30'
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          4. Content & Benchmarks
        </button>
      </div>

      {/* Categorized Panel Body */}
      <CardContent className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* ========================================================================= */}
        {/* CATEGORY 1: PROFILE COMPONENTS                                            */}
        {/* ========================================================================= */}
        {activeCategory === 'components' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. Headline Alternatives */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  Optimized Headline Alternatives ({suggestions.headline_alternatives?.length || 0})
                </h4>
                <span className="text-[10px] text-muted-foreground font-mono">Max 220 Chars</span>
              </div>

              <div className="space-y-2.5">
                {suggestions.headline_alternatives?.map((h, idx) => {
                  const key = `headline_${idx}`;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-border/40 bg-secondary/30 hover:border-blue-500/30 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-2 bg-blue-500/10 text-blue-300 border-blue-500/20 font-mono"
                        >
                          {h.target_focus}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {h.char_count || h.headline.length} chars
                        </span>
                      </div>

                      <p className="text-xs font-mono font-medium text-foreground leading-relaxed">
                        {h.headline}
                      </p>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleCopy(h.headline, key)}
                          className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                        >
                          {copiedKey === key ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedKey === key ? 'Copied' : 'Copy'}
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleApplyToDraft('headline', h.headline, key)}
                          className="h-6 text-[11px] px-2.5 rounded-lg border-blue-500/30 text-blue-300 hover:bg-blue-500/10 font-semibold gap-1"
                        >
                          <PlusCircle className="h-3 w-3" />
                          Stage to Headline
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Visual Presence Guidance */}
            {suggestions.visual_presence && (
              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 space-y-2.5">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                  Visual Presence & Banner Strategy
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-border/30 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Photo Advice:
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {suggestions.visual_presence.photo_recommendation}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-border/30 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Banner Strategy:
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {suggestions.visual_presence.banner_strategy}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. About Section Rewrite */}
            {suggestions.about_rewrite && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    Complete About Narrative Rewrite
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleCopy(suggestions.about_rewrite!, 'about_rewrite')}
                      className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                    >
                      {copiedKey === 'about_rewrite' ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        handleApplyToDraft('about', suggestions.about_rewrite, 'about_rewrite')
                      }
                      className="h-6 text-[11px] px-2.5 rounded-lg border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-semibold gap-1"
                    >
                      <PlusCircle className="h-3 w-3" />
                      Stage to About
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border/40 bg-slate-950/80 font-mono text-xs text-foreground whitespace-pre-line leading-relaxed shadow-inner">
                  {suggestions.about_rewrite}
                </div>
              </div>
            )}

            {/* 4. Experience Rewrites */}
            {suggestions.experience_rewrites && suggestions.experience_rewrites.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Briefcase className="h-3.5 w-3.5" />
                  </div>
                  Experience Role Rewrites ({suggestions.experience_rewrites.length})
                </h4>

                <div className="space-y-3">
                  {suggestions.experience_rewrites.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-border/40 bg-secondary/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold font-heading text-foreground">
                          {exp.role_title} {exp.company ? `@ ${exp.company}` : ''}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {exp.impact_metrics?.map((m) => (
                            <Badge
                              key={m}
                              variant="outline"
                              className="text-[9px] py-0 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono"
                            >
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <ul className="space-y-1.5 pl-2">
                        {exp.suggested_bullets.map((b, bIdx) => (
                          <li
                            key={bIdx}
                            className="text-[11px] text-muted-foreground font-mono flex items-start gap-1.5"
                          >
                            <span className="text-purple-400 font-bold">•</span>
                            <span className="text-foreground">{b}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex justify-end pt-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleCopy(exp.suggested_bullets.join('\n• '), `exp_${idx}`)}
                          className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                        >
                          {copiedKey === `exp_${idx}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy Bullets
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Skills Optimization */}
            {suggestions.skills_optimization && (
              <div className="p-4 rounded-2xl border border-border/40 bg-secondary/20 space-y-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                  Skills Section Optimization
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Top Pinned */}
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                      ⭐ Top 3 Pinned Skills:
                    </span>
                    <div className="flex flex-col gap-1">
                      {suggestions.skills_optimization.top_pinned_skills.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-[10px] bg-indigo-500/20 text-indigo-200 border-indigo-500/30 font-mono self-start"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Skills to Add */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                      ➕ Skills to Add:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.skills_optimization.skills_to_add.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-[10px] bg-emerald-500/15 text-emerald-300 border-emerald-500/20 font-mono"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Skills to Remove */}
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                      ❌ Outdated to Remove:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.skills_optimization.skills_to_remove.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-[10px] bg-rose-500/15 text-rose-300 border-rose-500/20 line-through font-mono"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY 2: GITHUB PROJECT INJECTIONS FOR LINKEDIN                         */}
        {/* ========================================================================= */}
        {activeCategory === 'projects' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <FolderGit2 className="h-3.5 w-3.5" />
                  </div>
                  GitHub Codebase Projects to Feature on LinkedIn
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Prominently showcase these real repositories in your LinkedIn Featured Section and Experience credentials.
                </p>
              </div>
            </div>

            {suggestions.recommended_projects_to_add?.map((proj, idx) => {
              const key = `proj_${idx}`;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-border/40 bg-secondary/30 space-y-3 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-2.5">
                    <div>
                      <span className="text-xs font-bold font-heading text-foreground">
                        {proj.title_for_linkedin}
                      </span>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Repo: <span className="text-purple-300">{proj.repo_full_name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-purple-500/15 text-purple-300 border-purple-500/30 font-mono"
                      >
                        Placement: {proj.linkedin_placement}
                      </Badge>

                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          handleCopy(
                            `${proj.title_for_linkedin}\n${proj.description_snippet}\nhttps://github.com/${proj.repo_full_name}`,
                            key
                          )
                        }
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                      >
                        {copiedKey === key ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedKey === key ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  {/* Why Add */}
                  <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/15 text-xs flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-purple-200/90 leading-relaxed">
                      <span className="font-semibold text-purple-300">Recruiter Proof: </span>
                      {proj.why_add}
                    </p>
                  </div>

                  {/* Description Snippet */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-border/30 text-xs font-mono text-muted-foreground space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Description Snippet for LinkedIn:
                    </span>
                    <p className="text-[11px] text-foreground leading-relaxed">
                      {proj.description_snippet}
                    </p>
                  </div>

                  {/* Skill tags */}
                  {proj.skills_tags && (
                    <div className="flex flex-wrap gap-1 items-center pt-1">
                      <span className="text-[10px] text-muted-foreground font-semibold">Tags:</span>
                      {proj.skills_tags.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-[9px] py-0 px-1.5 bg-secondary text-foreground border-border/40 font-mono"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Featured Advice */}
            {suggestions.featured_section_advice && (
              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 space-y-1.5 text-xs">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-indigo-400" />
                  Featured Section Strategy
                </span>
                <p className="text-[11px] text-indigo-100/90 leading-relaxed">
                  {suggestions.featured_section_advice}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY 3: STRATEGIC INSIGHTS & 30/60/90 ROADMAP                         */}
        {/* ========================================================================= */}
        {activeCategory === 'strategy' && (
          <div className="space-y-6 animate-fade-in">
            {/* 20-30 High Impact Industry Keywords */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Target className="h-3.5 w-3.5" />
                  </div>
                  High-Impact Industry Keywords ({suggestions.industry_keywords?.length || 0})
                </h4>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() =>
                    handleCopy((suggestions.industry_keywords || []).join(', '), 'all_keywords')
                  }
                  className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
                >
                  {copiedKey === 'all_keywords' ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  Copy All
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3.5 rounded-2xl border border-border/40 bg-secondary/30">
                {suggestions.industry_keywords?.map((kw) => (
                  <Badge
                    key={kw}
                    variant="outline"
                    className="text-xs py-1 px-2.5 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 font-mono hover:bg-emerald-500/20 transition-all cursor-default"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Wins vs Long Term */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Wins */}
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-950/20 space-y-2.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Quick Wins (24–48 Hours)
                </span>
                <ul className="space-y-2">
                  {suggestions.quick_wins?.map((w, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-amber-100/90 flex items-start gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Long Term */}
              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 space-y-2.5">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                  Long-Term Authority (30–90 Days)
                </span>
                <ul className="space-y-2">
                  {suggestions.long_term_improvements?.map((l, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-indigo-100/90 flex items-start gap-1.5"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 30/60/90 Day Roadmap */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                30 / 60 / 90 Day Inbound Growth Roadmap
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {suggestions.growth_roadmap?.map((phase, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-border/40 bg-secondary/30 space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono bg-purple-500/15 text-purple-300 border-purple-500/25 font-bold"
                      >
                        {phase.phase}
                      </Badge>
                      <ul className="space-y-1.5 pl-1">
                        {phase.key_actions?.map((act, aIdx) => (
                          <li
                            key={aIdx}
                            className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5"
                          >
                            <span className="text-purple-400 font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CATEGORY 4: CONTENT ENGINE & MARKET BENCHMARKS                             */}
        {/* ========================================================================= */}
        {activeCategory === 'content' && (
          <div className="space-y-6 animate-fade-in">
            {/* Industry Benchmarks */}
            {suggestions.industry_benchmarks && (
              <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-950/20 space-y-1.5 text-xs">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-blue-400" />
                  Industry Benchmarks & Recruiter Behavior
                </span>
                <p className="text-[11px] text-blue-100/90 leading-relaxed">
                  {suggestions.industry_benchmarks}
                </p>
              </div>
            )}

            {/* Content Ideas */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                Thought Leadership Content Strategy & Post Hooks ({suggestions.content_ideas?.length || 0})
              </h4>

              <div className="space-y-3">
                {suggestions.content_ideas?.map((c, idx) => {
                  const key = `content_${idx}`;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-border/40 bg-secondary/30 space-y-2.5 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-2">
                        <span className="text-xs font-bold font-heading text-foreground">
                          {c.topic}
                        </span>

                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleCopy(`${c.topic}\n\nHook:\n${c.suggested_hook}`, key)}
                          className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1 self-end sm:self-auto"
                        >
                          {copiedKey === key ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Copy Post Hook
                        </Button>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/70 border border-border/30 text-xs font-mono space-y-1">
                        <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                          Opening Hook:
                        </span>
                        <p className="text-[11px] text-foreground leading-relaxed italic">
                          &quot;{c.suggested_hook}&quot;
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground font-mono pt-1">
                        <span>
                          <strong className="text-foreground">Angle:</strong> {c.post_angle}
                        </span>
                        <span>
                          <strong className="text-foreground">Audience:</strong> {c.target_audience}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile Completion Gaps */}
            {suggestions.profile_completion_gaps && (
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-950/20 space-y-2">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  Profile Completion Gaps Hurting Discovery
                </span>
                <ul className="space-y-1.5 pl-1">
                  {suggestions.profile_completion_gaps.map((gap, idx) => (
                    <li
                      key={idx}
                      className="text-[11px] text-rose-200/90 flex items-start gap-1.5"
                    >
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
