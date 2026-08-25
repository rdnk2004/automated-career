import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeywordGap } from '@/types/analysis';
import { useProfile, useUpdateSection } from '@/hooks/useProfile';
import { toast } from '@/hooks/useToast';
import { Sparkles, Plus, Check, Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function KeywordGapBadges({ gaps = [] }: { gaps: (KeywordGap | string)[] }) {
  const [search, setSearch] = useState('');
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const { data: profile } = useProfile();
  const { mutate: updateSection } = useUpdateSection();

  if (!gaps || gaps.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground glass-card rounded-2xl border border-dashed border-border/40 text-xs space-y-2">
        <Sparkles className="h-6 w-6 text-indigo-400/50 mx-auto" />
        <p>No keyword gaps identified. Your profile has high alignment with target market JDs!</p>
      </div>
    );
  }

  // Normalize gaps
  const normalizedGaps = gaps.map((item) => {
    if (typeof item === 'string') {
      return { keyword: item, frequency: 1, is_technical: true };
    }
    return item;
  });

  const filteredGaps = normalizedGaps.filter((g) =>
    g.keyword.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSkillToProfile = (keyword: string) => {
    if (!profile || !profile.sections) {
      toast.error('Cannot add skill', 'Profile data is not loaded yet');
      return;
    }

    const skillsSection = profile.sections.find((s) => s.section_type.toLowerCase() === 'skills');
    if (!skillsSection) {
      toast.error('Skills section not found', 'Import or create a Skills section first');
      return;
    }

    const currentSkills = Array.isArray(skillsSection.content)
      ? skillsSection.content
      : skillsSection.content?.skills || [];

    const existingNames = currentSkills.map((s: any) =>
      typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase() || ''
    );

    if (existingNames.includes(keyword.toLowerCase())) {
      toast.warning('Already in Skills', `"${keyword}" is already in your skills profile`);
      setAddedSkills((prev) => new Set(prev).add(keyword));
      return;
    }

    const updatedSkills = [...currentSkills, keyword];
    const newContent = Array.isArray(skillsSection.content)
      ? updatedSkills
      : { ...skillsSection.content, skills: updatedSkills };

    updateSection(
      {
        section_type: 'skills',
        title: skillsSection.title || 'Skills',
        content: newContent,
      },
      {
        onSuccess: () => {
          setAddedSkills((prev) => new Set(prev).add(keyword));
          toast.success('Skill Added!', `Added "${keyword}" to your LinkedIn Skills section`);
        },
        onError: (err: any) => {
          toast.error('Failed to add skill', err?.message);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Filter Header */}
      <div className="flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter missing keywords..."
          className="h-8 text-xs bg-slate-950/80 max-w-xs"
          icon={<Search className="h-3.5 w-3.5" />}
        />
        <span className="text-[11px] font-mono text-muted-foreground">
          Showing {filteredGaps.length} of {normalizedGaps.length} gaps
        </span>
      </div>

      {/* Keyword Cloud Badges */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-border/40 min-h-[140px] flex flex-wrap gap-2.5 items-center">
        {filteredGaps.map((gap, i) => {
          const isAdded = addedSkills.has(gap.keyword);
          const freq = gap.frequency || 1;
          const isHigh = freq >= 8;

          return (
            <div
              key={i}
              className={cn(
                'group inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-sm',
                isAdded
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isHigh
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:border-rose-500/50'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200 hover:border-indigo-500/50'
              )}
            >
              <span className="font-semibold">{gap.keyword}</span>

              {freq > 1 && (
                <span
                  className={cn(
                    'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md',
                    isHigh
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  )}
                >
                  {freq}x
                </span>
              )}

              <button
                onClick={() => !isAdded && handleAddSkillToProfile(gap.keyword)}
                disabled={isAdded}
                className={cn(
                  'p-1 rounded-lg transition-colors cursor-pointer',
                  isAdded
                    ? 'text-emerald-400 bg-emerald-500/20'
                    : 'text-muted-foreground hover:text-white hover:bg-white/10'
                )}
                title={isAdded ? 'Added to Profile' : `Add ${gap.keyword} to Profile Skills`}
              >
                {isAdded ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 border-t border-border/30 pt-2">
        <span className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-rose-400" />
          Red chips denote high-frequency keywords found in 8+ target job postings
        </span>
        <span className="text-[10px] font-mono">1-click to add to profile</span>
      </div>
    </div>
  );
}
