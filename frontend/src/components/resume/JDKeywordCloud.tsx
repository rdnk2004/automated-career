import { useJobKeywords } from '@/hooks/useJobSearch';
import { useJobStore } from '@/stores/jobStore';
import { useMemo } from 'react';
import { Cloud, Sparkles } from 'lucide-react';

export function JDKeywordCloud() {
  const { activeTitle } = useJobStore();
  const { data: keywords, isLoading } = useJobKeywords(activeTitle);

  const cloudItems = useMemo(() => {
    if (!keywords || keywords.length === 0) return [];
    
    const top50 = [...keywords].sort((a, b) => b.frequency - a.frequency).slice(0, 50);
    const maxFreq = top50[0].frequency;
    const minFreq = top50[top50.length - 1].frequency;
    
    return top50.map(kw => {
      const ratio = maxFreq > minFreq ? (kw.frequency - minFreq) / (maxFreq - minFreq) : 0.5;
      const fontSize = Math.round(11 + (15 * ratio));
      
      return {
        ...kw,
        fontSize,
        colorClass: kw.is_technical
          ? 'text-indigo-400 hover:text-indigo-300 font-semibold drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]'
          : 'text-slate-400 hover:text-slate-200 font-medium'
      };
    });
  }, [keywords]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-3 glass-card rounded-2xl border border-border/40">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-medium">Extracting market keyword cloud...</p>
      </div>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground glass-card rounded-2xl border border-dashed border-border/40 space-y-2 text-xs">
        <Sparkles className="h-6 w-6 text-indigo-400/50 mx-auto" />
        <p>No JD keywords extracted. Search for a role to generate market signals.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl glass-card border border-border/40 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
          <Cloud className="h-4 w-4 text-indigo-400" />
          Top 50 Job Market Keywords
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Technical
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            General
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 items-center justify-center p-2 min-h-[160px]">
        {cloudItems.map((item, idx) => (
          <span 
            key={idx} 
            className={`transition-all duration-200 cursor-default px-2 py-0.5 rounded-lg hover:bg-white/5 ${item.colorClass}`}
            style={{ fontSize: `${item.fontSize}px` }}
            title={`Keyword: ${item.keyword} | Frequency: ${item.frequency}`}
          >
            {item.keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
