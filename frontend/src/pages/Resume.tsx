import { JobSearchBar } from '@/components/resume/JobSearchBar';
import { JDKeywordCloud } from '@/components/resume/JDKeywordCloud';
import { GapHeatmap } from '@/components/resume/GapHeatmap';
import { ResumeSuggestions } from '@/components/resume/ResumeSuggestions';

export default function Resume() {
  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      <JobSearchBar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Context & Evidence */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-border/40 space-y-6">
          <JDKeywordCloud />
          <GapHeatmap />
        </div>
        
        {/* Right Column: AI Action Area */}
        <div className="w-1/2 p-8 overflow-y-auto bg-card/30 backdrop-blur-xl">
          <ResumeSuggestions />
        </div>
      </div>
    </div>
  );
}
