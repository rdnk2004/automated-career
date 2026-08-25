import { useState, useMemo } from 'react';
import { useJobKeywords } from '@/hooks/useJobSearch';
import { useJobStore } from '@/stores/jobStore';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Cloud, Sparkles, Search, Tag, Cpu, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export function JDKeywordCloud() {
  const { activeTitle } = useJobStore();
  const { data: keywords, isLoading } = useJobKeywords(activeTitle);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'technical' | 'general'>('all');

  const filteredKeywords = useMemo(() => {
    if (!keywords || keywords.length === 0) return [];

    return keywords.filter((kw) => {
      const matchesSearch = kw.keyword.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === 'technical' && !kw.is_technical) return false;
      if (filterType === 'general' && kw.is_technical) return false;

      return true;
    });
  }, [keywords, search, filterType]);

  const cloudItems = useMemo(() => {
    if (filteredKeywords.length === 0) return [];

    const top50 = [...filteredKeywords]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50);
    const maxFreq = top50[0]?.frequency || 1;
    const minFreq = top50[top50.length - 1]?.frequency || 1;

    return top50.map((kw) => {
      const ratio = maxFreq > minFreq ? (kw.frequency - minFreq) / (maxFreq - minFreq) : 0.5;
      const fontSize = Math.round(11 + 14 * ratio);

      return {
        ...kw,
        fontSize,
        colorClass: kw.is_technical
          ? 'text-indigo-300 hover:text-indigo-100 font-semibold drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]'
          : 'text-slate-300 hover:text-white font-medium',
      };
    });
  }, [filteredKeywords]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-3 glass-card rounded-2xl border border-border/40">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-medium">Extracting market keyword cloud from JDs...</p>
      </div>
    );
  }

  if (!keywords || keywords.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground glass-card rounded-2xl border border-dashed border-border/40 space-y-2 text-xs">
        <Sparkles className="h-6 w-6 text-indigo-400/50 mx-auto" />
        <p>No JD keywords extracted yet. Search for a role in the top bar to extract market signals.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl glass-card border border-border/40 shadow-xl space-y-4">
      {/* Cloud Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-foreground">
              Top 50 Job Market Keywords
            </h3>
            <p className="text-[11px] text-muted-foreground">Aggregated frequency across target JDs</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-xl border border-border/40 text-[11px]">
          <button
            onClick={() => setFilterType('all')}
            className={cn(
              'px-2.5 py-1 rounded-lg font-semibold transition-all select-none',
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('technical')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all select-none',
              filterType === 'technical'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Cpu className="h-3 w-3" />
            Technical
          </button>
          <button
            onClick={() => setFilterType('general')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all select-none',
              filterType === 'general'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="h-3 w-3" />
            Domain
          </button>
        </div>
      </div>

      {/* Real-time Keyword Search Box */}
      <div className="flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter keywords..."
          className="h-8 text-xs bg-slate-950/80 max-w-xs"
          icon={<Search className="h-3.5 w-3.5" />}
        />
        <span className="text-[11px] font-mono text-muted-foreground">
          {cloudItems.length} keywords displayed
        </span>
      </div>

      {/* Word Cloud Surface */}
      <div className="flex flex-wrap gap-2.5 items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-border/40 min-h-[160px]">
        {cloudItems.map((item, idx) => (
          <span
            key={idx}
            className={cn(
              'transition-all duration-200 cursor-default px-2.5 py-1 rounded-xl border border-transparent hover:border-indigo-500/40 hover:bg-white/5 select-none',
              item.colorClass
            )}
            style={{ fontSize: `${item.fontSize}px` }}
            title={`Keyword: ${item.keyword} • Frequency: ${item.frequency} JDs`}
          >
            {item.keyword}
            <span className="text-[9px] text-muted-foreground/80 font-mono ml-1">
              {item.frequency}x
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
