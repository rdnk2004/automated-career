import { useSettingsStore } from '@/stores/settingsStore';
import { useLinkedInAnalysis } from '@/hooks/useAnalysis';
import { ProfileEditor } from '@/components/linkedin/ProfileEditor';
import { SuggestionPanel } from '@/components/linkedin/SuggestionPanel';
import { Button } from '@/components/ui/button';

export default function LinkedIn() {
  const { targetRole } = useSettingsStore();
  const { mutate: runAnalysis, isPending, data: suggestions } = useLinkedInAnalysis(targetRole);

  return (
    <div className="flex h-full">
      <div className="w-1/2 p-6 overflow-y-auto border-r">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">LinkedIn Profile</h2>
          <Button onClick={() => runAnalysis()} disabled={isPending}>
            {isPending ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
        <ProfileEditor />
      </div>
      <div className="w-1/2 h-full">
        <SuggestionPanel suggestions={suggestions || null} />
      </div>
    </div>
  );
}
