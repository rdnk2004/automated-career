import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJobStore } from '@/stores/jobStore';
import { useJobSearch } from '@/hooks/useJobSearch';

export function JobSearchBar() {
  const { activeTitle, setActiveTitle } = useJobStore();
  const [inputVal, setInputVal] = useState(activeTitle);
  const { isPending, data: jobs } = useJobSearch(activeTitle);

  const handleSearch = () => {
    if (inputVal.trim()) {
      setActiveTitle(inputVal.trim());
    }
  };

  return (
    <div className="flex flex-col gap-2 p-6 bg-card border-b">
      <h2 className="text-2xl font-bold tracking-tight">Resume Optimizer</h2>
      <div className="flex gap-4 items-center">
        <Input 
          value={inputVal} 
          onChange={(e) => setInputVal(e.target.value)} 
          placeholder="e.g. AI Engineer" 
          className="max-w-md"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isPending}>
          {isPending ? 'Searching...' : 'Analyze Market'}
        </Button>
      </div>
      <div className="text-sm text-muted-foreground mt-2">
        {jobs && jobs.length > 0 ? `Found ${jobs.length} recent job listings for "${activeTitle}".` : 'Enter a role to analyze market data.'}
      </div>
    </div>
  );
}
