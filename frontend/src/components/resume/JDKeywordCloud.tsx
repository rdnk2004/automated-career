import { useJobKeywords } from '@/hooks/useJobSearch';
import { useJobStore } from '@/stores/jobStore';
import { useMemo } from 'react';

export function JDKeywordCloud() {
  const { activeTitle } = useJobStore();
  const { data: keywords, isLoading } = useJobKeywords(activeTitle);

  const cloudItems = useMemo(() => {
    if (!keywords || keywords.length === 0) return [];
    
    const top50 = [...keywords].sort((a, b) => b.frequency - a.frequency).slice(0, 50);
    const maxFreq = top50[0].frequency;
    const minFreq = top50[top50.length - 1].frequency;
    
    return top50.map(kw => {
      // Font size proportional to frequency (min 12px, max 28px)
      const ratio = maxFreq > minFreq ? (kw.frequency - minFreq) / (maxFreq - minFreq) : 0.5;
      const fontSize = Math.round(12 + (16 * ratio));
      
      return {
        ...kw,
        fontSize,
        colorClass: kw.is_technical ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
      };
    });
  }, [keywords]);

  if (isLoading) return <div className="p-6">Loading keywords...</div>;
  if (!keywords || keywords.length === 0) return <div className="p-6 text-muted-foreground">No keywords found for this role. Try searching.</div>;

  return (
    <div className="p-6 border rounded-md bg-card">
      <h3 className="text-lg font-semibold mb-4">Top 50 Job Description Keywords</h3>
      <div className="flex flex-wrap gap-3 items-center justify-center">
        {cloudItems.map((item, idx) => (
          <span 
            key={idx} 
            className={`font-medium transition-colors hover:text-primary ${item.colorClass}`}
            style={{ fontSize: `${item.fontSize}px` }}
            title={`Frequency: ${item.frequency}`}
          >
            {item.keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
