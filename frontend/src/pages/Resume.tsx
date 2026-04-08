import { JobSearchBar } from '@/components/resume/JobSearchBar';
import { JDKeywordCloud } from '@/components/resume/JDKeywordCloud';
import { GapHeatmap } from '@/components/resume/GapHeatmap';
import { ResumeSuggestions } from '@/components/resume/ResumeSuggestions';

export default function Resume() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <JobSearchBar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Context & Evidence */}
        <div className="w-1/2 p-6 overflow-y-auto border-r space-y-6">
          <JDKeywordCloud />
          <GapHeatmap />
        </div>
        
        {/* Right Column: AI Action Area */}
        <div className="w-1/2 p-6 overflow-y-auto bg-muted/5">
          <ResumeSuggestions />
        </div>
      </div>
    </div>
  );
}
