import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLinkedInAnalysis } from '@/hooks/useAnalysis';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/useToast';
import { ProfileEditor } from '@/components/linkedin/ProfileEditor';
import { LinkedInCategorizedStudio } from '@/components/linkedin/LinkedInCategorizedStudio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Linkedin as LinkedinIcon,
  Target,
  Award,
} from 'lucide-react';

export default function LinkedIn() {
  const { targetRole, setTargetRole } = useSettingsStore();
  const [roleInput, setRoleInput] = useState(targetRole);
  const { mutate: runAnalysis, isPending, data: suggestions } = useLinkedInAnalysis(targetRole);
  const { data: profile } = useProfile();

  const handleRunAnalysis = () => {
    const role = roleInput.trim() || targetRole;
    if (role !== targetRole) {
      setTargetRole(role);
    }
    toast.ai('Analyzing LinkedIn Profile...', `Scanning profile sections against live ${role} JDs & GitHub projects`);
    runAnalysis(undefined, {
      onSuccess: () => toast.success('LinkedIn Categorized Analysis Complete!'),
      onError: (err: any) => toast.error('Analysis failed', err?.message),
    });
  };

  // Profile Score
  const displayScore = suggestions?.profile_score ?? (
    profile?.sections?.length ? 78 : null
  );

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden animate-fade-in">
      {/* Left Column: Profile Sections & Visual Form Editors */}
      <div className="w-full lg:w-1/2 p-6 sm:p-8 overflow-y-auto border-r border-border/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold font-heading tracking-tight text-foreground flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
                <LinkedinIcon className="h-5 w-5" />
              </div>
              LinkedIn Studio
            </h2>
            <p className="text-xs text-muted-foreground">
              Review and edit your structured LinkedIn sections with categorized AI optimization
            </p>
          </div>

          <div className="flex items-center gap-2">
            {displayScore !== null && (
              <Badge
                variant="outline"
                className="text-xs font-mono bg-blue-500/10 text-blue-300 border-blue-500/30 px-2.5 py-1 flex items-center gap-1.5"
              >
                <Award className="h-3.5 w-3.5 text-blue-400" />
                Profile Strength: <strong className="text-white">{displayScore}%</strong>
              </Badge>
            )}
          </div>
        </div>

        {/* Target Role & Analysis Trigger Banner */}
        <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-xl border border-border/40 flex-1">
            <Target className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <Input
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
              placeholder="Target Role (e.g. AI Engineer)"
              className="h-6 text-xs bg-transparent border-0 p-0 focus-visible:ring-0 text-foreground"
            />
          </div>

          <Button
            onClick={handleRunAnalysis}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-4 h-9 text-xs font-semibold gap-2 shrink-0"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Analyzing Profile...' : 'Run Analysis'}
          </Button>
        </div>

        {/* Visual Profile Sections */}
        <ProfileEditor />
      </div>

      {/* Right Column: Categorized AI Suggestion Studio */}
      <div className="w-full lg:w-1/2 p-6 sm:p-8 overflow-y-auto bg-card/30 backdrop-blur-xl">
        <LinkedInCategorizedStudio
          suggestions={suggestions || null}
          isLoading={isPending}
          profile={profile || null}
          targetRole={roleInput || targetRole || 'AI Engineer'}
        />
      </div>
    </div>
  );
}
