import { JobSearchBar } from '@/components/resume/JobSearchBar';
import { JDKeywordCloud } from '@/components/resume/JDKeywordCloud';
import { GapHeatmap } from '@/components/resume/GapHeatmap';
import { ResumeSuggestions } from '@/components/resume/ResumeSuggestions';

export default function Resume() {
  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      <JobSearchBar />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Column: Context, JD Word Cloud & Heatmap */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 overflow-y-auto border-r border-border/40 space-y-6">
          <JDKeywordCloud />
          <GapHeatmap />
        </div>

        {/* Right Column: AI Action Area & Resume Rewrites */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 overflow-y-auto bg-card/30 backdrop-blur-xl">
          <ResumeSuggestions />
        </div>
      </div>
    </div>
  );
}
