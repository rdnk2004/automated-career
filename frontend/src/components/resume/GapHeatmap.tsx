import { useState, useMemo } from 'react';
import { useJobKeywords } from '@/hooks/useJobSearch';
import { useJobStore } from '@/stores/jobStore';
import { useProfile } from '@/hooks/useProfile';
import { useRepos } from '@/hooks/useGithubRepos';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Copy, Info, Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface CellDetail {
  kw: string;
  frequency: number;
  row: string;
  status: 'match' | 'partial' | 'missing';
  evidence: string;
}

export function GapHeatmap() {
  const { activeTitle } = useJobStore();
  const { data: keywords, isLoading: isKwLoading } = useJobKeywords(activeTitle);
  const { data: profile, isLoading: isProfLoading } = useProfile();
  const { data: repos } = useRepos();

  const [filterMode, setFilterMode] = useState<'all' | 'matched' | 'missing'>('all');
  const [hoveredCell, setHoveredCell] = useState<CellDetail | null>(null);
  const [copiedSkill, setCopiedSkill] = useState<string | null>(null);

  // Multi-source skill extraction and correlation logic
  const matrixData = useMemo(() => {
    if (!keywords || keywords.length === 0) return null;

    // Top 15 target role keywords by frequency
    const topKeywords = [...keywords]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);

    // 1. Profile Listed Skills
    const skillsSec = profile?.sections?.find(s => s.section_type === 'skills');
    const profileSkills: string[] = (skillsSec?.content?.skills || [])
      .map((s: any) => (typeof s === 'string' ? s : s.name || '').toLowerCase())
      .filter(Boolean);

    // 2. GitHub Repositories (Languages, Topics, Names)
    const githubSkills: { term: string; repoName: string }[] = [];
    (repos || []).forEach(r => {
      if (r.language) githubSkills.push({ term: r.language.toLowerCase(), repoName: r.name });
      (r.topics || []).forEach(t => githubSkills.push({ term: t.toLowerCase(), repoName: r.name }));
      if (r.name) githubSkills.push({ term: r.name.toLowerCase(), repoName: r.name });
    });

    // 3. Work Experience Descriptions
    const expSecs = (profile?.sections || []).filter(s => s.section_type === 'experience');
    const expEntries = expSecs.map((s, idx) => ({
      title: s.title || `Position ${idx + 1}`,
      desc: JSON.stringify(s.content || {}).toLowerCase()
    }));

    // 4. Education & Certifications
    const eduSecs = (profile?.sections || []).filter(s => s.section_type === 'education' || s.section_type === 'certifications');
    const eduText = eduSecs.map(s => JSON.stringify(s.content || {}).toLowerCase()).join(' ');

    const rows = [
      { id: 'skills', label: 'Profile Skills' },
      { id: 'github', label: 'GitHub Repos' },
      { id: 'experience', label: 'Work Experience' },
      { id: 'education', label: 'Education & Certs' },
    ];

    let matchedKeywordsCount = 0;

    const cols = topKeywords.map(kwObj => {
      const kw = kwObj.keyword;
      const kwLower = kw.toLowerCase();
      let kwHasAnyMatch = false;

      const rowEvaluations = rows.map(r => {
        let status: 'match' | 'partial' | 'missing' = 'missing';
        let evidence = 'No evidence found in this source';

        if (r.id === 'skills') {
          const direct = profileSkills.find(s => s === kwLower || s.includes(kwLower) || kwLower.includes(s));
          if (direct) {
            status = 'match';
            evidence = `Explicitly listed under Profile Skills ("${direct}")`;
            kwHasAnyMatch = true;
          }
        } else if (r.id === 'github') {
          const matchedRepo = githubSkills.find(g => g.term.includes(kwLower) || kwLower.includes(g.term));
          if (matchedRepo) {
            status = 'match';
            evidence = `Matched in GitHub repository: ${matchedRepo.repoName}`;
            kwHasAnyMatch = true;
          }
        } else if (r.id === 'experience') {
          const matchedExp = expEntries.find(e => e.desc.includes(kwLower));
          if (matchedExp) {
            status = 'match';
            evidence = `Matched in Experience: ${matchedExp.title}`;
            kwHasAnyMatch = true;
          } else {
            const partialWord = kwLower.split(' ').find(w => w.length > 3 && expEntries.some(e => e.desc.includes(w)));
            if (partialWord) {
              status = 'partial';
              evidence = `Partial keyword match ("${partialWord}") found in Experience`;
              kwHasAnyMatch = true;
            }
          }
        } else if (r.id === 'education') {
          if (eduText.includes(kwLower)) {
            status = 'match';
            evidence = `Matched in Education or Certification background`;
            kwHasAnyMatch = true;
          }
        }

        return {
          rowId: r.id,
          rowLabel: r.label,
          status,
          evidence
        };
      });

      if (kwHasAnyMatch) matchedKeywordsCount++;

      return {
        keyword: kw,
        frequency: kwObj.frequency,
        hasMatch: kwHasAnyMatch,
        evaluations: rowEvaluations
      };
    });

    // Filter cols based on selected filter
    const filteredCols = cols.filter(c => {
      if (filterMode === 'matched') return c.hasMatch;
      if (filterMode === 'missing') return !c.hasMatch;
      return true;
    });

    const matchRate = Math.round((matchedKeywordsCount / topKeywords.length) * 100);
    const missingKeywords = cols.filter(c => !c.hasMatch).map(c => c.keyword);

    return {
      rows,
      cols: filteredCols,
      allColsCount: topKeywords.length,
      matchedCount: matchedKeywordsCount,
      missingCount: topKeywords.length - matchedKeywordsCount,
      matchRate,
      missingKeywords
    };
  }, [keywords, profile, repos, filterMode]);

  const handleCopySkill = (skill: string) => {
    navigator.clipboard.writeText(skill);
    setCopiedSkill(skill);
    setTimeout(() => setCopiedSkill(null), 2000);
  };

  if (isKwLoading || isProfLoading) {
    return (
      <Card className="p-8 glass-card rounded-2xl border border-border/40 text-center text-muted-foreground space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium">Synthesizing skill gap matrix...</p>
      </Card>
    );
  }

  if (!matrixData || matrixData.allColsCount === 0) {
    return (
      <Card className="p-8 glass-card rounded-2xl border border-dashed border-border/40 text-center text-muted-foreground space-y-2 text-xs">
        <Info className="w-6 h-6 text-indigo-400/50 mx-auto" />
        <h4 className="font-semibold text-foreground">No Keyword Matrix Available</h4>
        <p>Search for a target job role in the bar above to analyze skill alignment against live market job postings.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-border/40 glass-card rounded-2xl shadow-xl">
      <CardHeader className="pb-3 border-b border-border/30 bg-secondary/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold font-heading text-foreground">Skill Gap Heatmap Matrix</CardTitle>
              <Badge variant="outline" className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                Target: {activeTitle || "Software Engineer"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Correlates target JD demand against your profile, experience, and GitHub repositories.
            </p>
          </div>

          {/* Metric Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Market Alignment</div>
              <div className="text-xl font-extrabold font-heading text-emerald-400">
                {matrixData.matchRate}%
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-300 shadow-md">
              {matrixData.matchedCount}/{matrixData.allColsCount}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/40 text-xs">
            <button
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterMode === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setFilterMode('all')}
            >
              All ({matrixData.allColsCount})
            </button>
            <button
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterMode === 'matched' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setFilterMode('matched')}
            >
              Matched ({matrixData.matchedCount})
            </button>
            <button
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterMode === 'missing' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setFilterMode('missing')}
            >
              Missing ({matrixData.missingCount})
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm inline-block"></span>
              <span className="text-muted-foreground font-medium">Full Match</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-sm inline-block"></span>
              <span className="text-muted-foreground font-medium">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700 inline-block"></span>
              <span className="text-muted-foreground font-medium">Missing</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative overflow-x-auto">
        <div className="p-4 min-w-[700px]">
          {matrixData.cols.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No keywords match the selected filter criteria.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr>
                  <th className="p-2 border-b border-border/30 font-semibold text-muted-foreground w-40">Source / Keyword</th>
                  {matrixData.cols.map((col, idx) => (
                    <th key={idx} className="p-2 border-b border-border/30 font-semibold text-center min-w-[50px] max-w-[80px]">
                      <div className="truncate font-medium text-foreground" title={`${col.keyword} (Freq: ${col.frequency})`}>
                        {col.keyword}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        ({col.frequency} JDs)
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {matrixData.rows.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-2 border-b border-border/30 font-medium text-foreground whitespace-nowrap">
                      {r.label}
                    </td>
                    {matrixData.cols.map((col, cIdx) => {
                      const evalResult = col.evaluations.find(ev => ev.rowId === r.id)!;
                      let bgClass = 'bg-slate-900 border-slate-800';
                      
                      if (evalResult.status === 'match') {
                        bgClass = 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 shadow-sm shadow-emerald-500/20 cursor-pointer';
                      } else if (evalResult.status === 'partial') {
                        bgClass = 'bg-amber-400 hover:bg-amber-300 border-amber-400 shadow-sm shadow-amber-400/20 cursor-pointer';
                      }

                      return (
                        <td key={cIdx} className="p-2 border-b border-border/30 text-center align-middle">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-md border transition-all transform hover:scale-110 focus:outline-none ${bgClass}`}
                            onMouseEnter={() => setHoveredCell({
                              kw: col.keyword,
                              frequency: col.frequency,
                              row: r.label,
                              status: evalResult.status,
                              evidence: evalResult.evidence
                            })}
                            onMouseLeave={() => setHoveredCell(null)}
                            aria-label={`${r.label} - ${col.keyword}: ${evalResult.status}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Interactive Evidence Hover Popover */}
          {hoveredCell && (
            <div className="mt-4 p-3 rounded-xl border border-indigo-500/30 bg-slate-950/90 shadow-xl text-xs space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-foreground">
                  {hoveredCell.status === 'match' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {hoveredCell.status === 'partial' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {hoveredCell.status === 'missing' && <XCircle className="w-4 h-4 text-rose-400" />}
                  {hoveredCell.kw}
                  <span className="text-[10px] text-muted-foreground font-normal">
                    (Demanded in {hoveredCell.frequency} job postings)
                  </span>
                </span>
                <Badge variant={hoveredCell.status === 'match' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                  {hoveredCell.status}
                </Badge>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">{hoveredCell.row}:</span> {hoveredCell.evidence}
              </div>
            </div>
          )}

          {/* Missing Skills Recommendation Box */}
          {matrixData.missingKeywords.length > 0 && (
            <div className="mt-4 p-3.5 rounded-xl border bg-rose-500/10 border-rose-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Top Missing High-Demand Skills (Click to copy for resume):
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matrixData.missingKeywords.slice(0, 8).map(skill => (
                  <Button
                    key={skill}
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px] px-2.5 bg-slate-900 hover:bg-slate-800 border-rose-500/30 text-rose-300"
                    onClick={() => handleCopySkill(skill)}
                  >
                    {copiedSkill === skill ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3 text-muted-foreground" /> {skill}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
