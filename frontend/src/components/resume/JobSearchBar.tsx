import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useJobStore } from '@/stores/jobStore';
import { useJobSearch } from '@/hooks/useJobSearch';
import { Search, Sparkles, Target, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function JobSearchBar() {
  const { activeTitle, setActiveTitle } = useJobStore();
  const [inputVal, setInputVal] = useState(activeTitle);
  const { isPending, data: jobs } = useJobSearch(activeTitle);

  const quickRoles = ['AI Engineer', 'Senior Frontend Engineer', 'Full Stack Developer', 'MLOps Engineer'];

  const handleSearch = (roleOverride?: string) => {
    const roleToUse = roleOverride || inputVal;
    if (roleToUse.trim()) {
      setActiveTitle(roleToUse.trim());
      setInputVal(roleToUse.trim());
    }
  };

  return (
    <div className="p-6 bg-card/60 backdrop-blur-xl border-b border-border/40 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-heading tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Briefcase className="h-5 w-5" />
            </div>
            Resume Market Matcher
          </h2>
          <p className="text-xs text-muted-foreground">
            Scrape & analyze live Indeed job market signals to measure keyword coverage and rewrite resume bullet points.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={inputVal} 
              onChange={(e) => setInputVal(e.target.value)} 
              placeholder="Target Role (e.g. AI Engineer)" 
              className="pl-10 h-10 text-xs rounded-xl bg-slate-900 border-border/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button 
            onClick={() => handleSearch()} 
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl h-10 px-5 text-xs font-semibold gap-1.5 shrink-0"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Analyzing Market...' : 'Analyze Market'}
          </Button>
        </div>
      </div>

      {/* Quick Roles & Market Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Quick Roles:</span>
          <div className="flex flex-wrap gap-1.5">
            {quickRoles.map(role => (
              <Badge 
                key={role}
                variant="outline"
                onClick={() => handleSearch(role)}
                className="cursor-pointer bg-secondary/40 hover:bg-indigo-500/15 hover:text-indigo-300 hover:border-indigo-500/30 transition-all text-[11px] py-0.5"
              >
                {role}
              </Badge>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 bg-secondary/30 px-3 py-1 rounded-full border border-border/30">
          <Target className="h-3 w-3 text-emerald-400" />
          {jobs && jobs.length > 0 ? `Scraped ${jobs.length} live JDs for "${activeTitle}"` : 'Enter a role to extract market signal'}
        </div>
      </div>
    </div>
  );
}
