import { useSettingsStore } from '@/stores/settingsStore';
import { useLinkedInAnalysis } from '@/hooks/useAnalysis';
import { ProfileEditor } from '@/components/linkedin/ProfileEditor';
import { SuggestionPanel } from '@/components/linkedin/SuggestionPanel';
import { Button } from '@/components/ui/button';
import { Sparkles, Linkedin as LinkedinIcon } from 'lucide-react';

export default function LinkedIn() {
  const { targetRole } = useSettingsStore();
  const { mutate: runAnalysis, isPending, data: suggestions } = useLinkedInAnalysis(targetRole);

  return (
    <div className="flex h-full overflow-hidden animate-fade-in">
      {/* Left Column: Profile Sections */}
      <div className="w-1/2 p-8 overflow-y-auto border-r border-border/40 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold font-heading tracking-tight text-foreground flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <LinkedinIcon className="h-5 w-5" />
              </div>
              LinkedIn Profile
            </h2>
            <p className="text-xs text-muted-foreground">
              Review and edit your structured LinkedIn sections & AI quality scores
            </p>
          </div>

          <Button
            onClick={() => runAnalysis()}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-4 text-xs font-semibold gap-2"
          >
            <Sparkles className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Analyzing Profile...' : 'Run Analysis'}
          </Button>
        </div>

        <ProfileEditor />
      </div>

      {/* Right Column: AI Suggestion Studio */}
      <div className="w-1/2 h-full">
        <SuggestionPanel suggestions={suggestions || null} />
      </div>
    </div>
  );
}
