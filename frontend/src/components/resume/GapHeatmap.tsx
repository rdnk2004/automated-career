import React from 'react';
import { useJobKeywords } from '@/hooks/useJobSearch';
import { useJobStore } from '@/stores/jobStore';
import { useProfile } from '@/hooks/useProfile';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function GapHeatmap() {
  const { activeTitle } = useJobStore();
  const { data: keywords } = useJobKeywords(activeTitle);
  const { data: profile } = useProfile();

  const heatmapData = useMemo(() => {
    if (!keywords || !profile) return null;

    const topKeywords = [...keywords].sort((a, b) => b.frequency - a.frequency).slice(0, 15);
    
    // Extract skills and projects from profile
    const skillsSection = profile.sections.find(s => s.section_type === 'skills');
    const userSkills = skillsSection?.content?.skills?.map((s: any) => s.name?.toLowerCase()) || [];
    
    const expSections = profile.sections.filter(s => s.section_type === 'experience');
    const userProjects = expSections.map(s => s.content?.description?.toLowerCase() || "");

    const rows = ['Profile Skills', 'Experience 1', 'Experience 2'];
    
    const grid = rows.map((rowName, rIdx) => {
      return topKeywords.map(kw => {
        const kwLower = kw.keyword.toLowerCase();
        let isMatch = false;
        let isPartial = false;
        
        if (rIdx === 0) {
          isMatch = userSkills.some((s: string) => s.includes(kwLower));
        } else {
          const expDesc = userProjects[rIdx - 1] || "";
          if (expDesc.includes(kwLower)) isMatch = true;
          else if (kwLower.split(' ').some(word => word.length > 3 && expDesc.includes(word))) isPartial = true;
        }

        let cellColor = 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-900/50'; // missing
        if (isMatch) cellColor = 'bg-green-500 border-green-600 shadow-sm'; // match
        else if (isPartial) cellColor = 'bg-amber-400 border-amber-500 shadow-sm'; // partial

        return { kw: kw.keyword, color: cellColor, row: rowName };
      });
    });

    return { cols: topKeywords.map(k => k.keyword), grid, rows };
  }, [keywords, profile]);

  if (!heatmapData) return <div className="p-6 text-muted-foreground">Waiting for data...</div>;

  return (
    <Card className="overflow-x-auto">
      <CardHeader>
        <CardTitle className="text-lg">Skill Gap Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-w-[600px]">
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${heatmapData.cols.length}, minmax(40px, 1fr))` }}>
            <div className="p-2"></div>
            {heatmapData.cols.map((col, i) => (
              <div key={i} className="p-2 text-xs text-center font-medium truncate -rotate-45 origin-bottom-left h-24 flex items-end">
                <span className="w-24 block truncate">{col}</span>
              </div>
            ))}
            
            {heatmapData.rows.map((rowName, rIdx) => (
              <React.Fragment key={rIdx}>
                <div className="p-2 text-sm font-medium border-t">{rowName}</div>
                {heatmapData.grid[rIdx].map((cell, cIdx) => (
                  <div key={cIdx} className="p-2 border-t flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-sm border ${cell.color}`} title={`${rowName} - ${cell.kw}`}></div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
