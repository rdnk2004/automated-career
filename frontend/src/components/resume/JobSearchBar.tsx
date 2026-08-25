import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useJobStore } from '@/stores/jobStore';
import { useJobSearch } from '@/hooks/useJobSearch';
import { toast } from '@/hooks/useToast';
import {
  Search,
  Sparkles,
  Target,
  Briefcase,
  MapPin,
  History,
  X,
} from 'lucide-react';

export function JobSearchBar() {
  const {
    activeTitle,
    setActiveTitle,
    activeLocation,
    setActiveLocation,
    searchHistory,
  } = useJobStore();

  const [titleInput, setTitleInput] = useState(activeTitle);
  const [locationInput, setLocationInput] = useState(activeLocation || 'remote');
  const { isPending, data: jobs } = useJobSearch(activeTitle, activeLocation);

  const quickRoles = [
    'AI Engineer',
    'Senior Frontend Engineer',
    'Full Stack Engineer',
    'MLOps Architect',
    'Staff Software Engineer',
  ];

  const handleSearch = (roleOverride?: string, locOverride?: string) => {
    const roleToUse = (roleOverride || titleInput).trim();
    const locToUse = (locOverride || locationInput).trim() || 'remote';

    if (roleToUse) {
      setActiveTitle(roleToUse);
      setTitleInput(roleToUse);
      setActiveLocation(locToUse);
      setLocationInput(locToUse);

      toast.ai(
        'Scraping Live Job Postings...',
        `Fetching 30+ Indeed job descriptions for "${roleToUse}" (${locToUse})`
      );
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-card/60 backdrop-blur-xl border-b border-border/40 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold font-heading tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            Resume Market Matcher
          </h2>
          <p className="text-xs text-muted-foreground">
            Scrape and synthesize live job market signals to measure ATS keyword coverage and bullet point impact
          </p>
        </div>

        {/* Dual Input Search Bar (Title & Location) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Target Role (e.g. AI Engineer)"
              className="pl-9 h-10 text-xs rounded-xl bg-slate-950/80 border-border/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="relative w-full sm:w-40">
            <MapPin className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Location (e.g. Remote)"
              className="pl-9 h-10 text-xs rounded-xl bg-slate-950/80 border-border/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <Button
            onClick={() => handleSearch()}
            disabled={isPending || !titleInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl h-10 px-5 text-xs font-semibold gap-1.5 shrink-0"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Scraping JDs...' : 'Scrape Market'}
          </Button>
        </div>
      </div>

      {/* Quick Roles & Live Telemetry Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            Quick Roles:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickRoles.map((role) => (
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
          {jobs && jobs.length > 0
            ? `Extracted ${jobs.length} live job listings for "${activeTitle}"`
            : 'Enter a target role to extract market signal'}
        </div>
      </div>
    </div>
  );
}
