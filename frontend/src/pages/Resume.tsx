import { useState, useEffect } from 'react';
import { JobSearchBar } from '@/components/resume/JobSearchBar';
import { JDKeywordCloud } from '@/components/resume/JDKeywordCloud';
import { GapHeatmap } from '@/components/resume/GapHeatmap';
import { ResumeVaultManager } from '@/components/resume/ResumeVaultManager';
import { ProjectRecommendations } from '@/components/resume/ProjectRecommendations';
import { ResumeDestroyerCard } from '@/components/resume/ResumeDestroyerCard';
import { useResumes, useCreateResume, useUpdateResume, useDeleteResume, useSetPrimaryResume, useAnalyzeWithDestroyer } from '@/hooks/useResumes';
import { useJobStore } from '@/stores/jobStore';
import { analysisApi } from '@/services/analysisApi';
import { toast } from '@/hooks/useToast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TargetedResume } from '@/types/resume';
import {
  FileText,
  Save,
} from 'lucide-react';

export default function Resume() {
  const { activeTitle, setActiveTitle } = useJobStore();
  const { data: resumes = [] } = useResumes();
  const { mutate: createResume } = useCreateResume();
  const { mutate: updateResume, isPending: isUpdating } = useUpdateResume();
  const { mutate: deleteResume } = useDeleteResume();
  const { mutate: setPrimaryResume } = useSetPrimaryResume();
  const { mutate: analyzeWithDestroyer, isPending: isAnalyzing } = useAnalyzeWithDestroyer();

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-select primary or first resume matching activeTitle or first available
  useEffect(() => {
    if (resumes.length > 0) {
      if (!selectedResumeId || !resumes.some((r) => r.id === selectedResumeId)) {
        const matchingRole = resumes.find(
          (r) => r.target_role.toLowerCase() === (activeTitle || '').toLowerCase() && r.is_primary
        ) || resumes.find(
          (r) => r.target_role.toLowerCase() === (activeTitle || '').toLowerCase()
        ) || resumes[0];

        setSelectedResumeId(matchingRole.id);
        setEditedText(matchingRole.raw_text);
        setHasUnsavedChanges(false);
      }
    }
  }, [resumes, activeTitle, selectedResumeId]);

  const activeResume = resumes.find((r) => r.id === selectedResumeId) || null;

  const handleSelectResume = (resume: TargetedResume) => {
    setSelectedResumeId(resume.id);
    setEditedText(resume.raw_text);
    setHasUnsavedChanges(false);
    if (resume.target_role && resume.target_role !== activeTitle) {
      setActiveTitle(resume.target_role);
    }
  };

  const handleTextChange = (val: string) => {
    setEditedText(val);
    setHasUnsavedChanges(true);
  };

  const handleSaveText = () => {
    if (!activeResume) return;
    updateResume(
      { id: activeResume.id, payload: { raw_text: editedText } },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          toast.success('Resume Changes Saved to Vault');
        },
        onError: (err: any) => toast.error('Failed to save resume', err?.message),
      }
    );
  };

  const handleInsertBullets = (bullets: string[]) => {
    const formatted = `\n\n• ${bullets.join('\n• ')}`;
    const newText = editedText + formatted;
    setEditedText(newText);
    setHasUnsavedChanges(true);
  };

  const handleRunDestroyer = () => {
    if (!activeResume) return;
    // Save current text first if changed
    if (hasUnsavedChanges) {
      updateResume({ id: activeResume.id, payload: { raw_text: editedText } });
      setHasUnsavedChanges(false);
    }

    toast.ai(
      'Executing The Resume Destroyer...',
      `Brutally analyzing ${activeResume.title} against live ${activeResume.target_role} market data`
    );

    analyzeWithDestroyer(activeResume.id, {
      onSuccess: (data) => {
        toast.success(
          'Resume Teardown Complete!',
          `BS Factor: ${data.overall_bs_factor.toFixed(1)}/10 • ATS Match: ${data.match_score}%`
        );
      },
      onError: (err: any) => toast.error('Resume Destroyer Failed', err?.message),
    });
  };

  const handleExportPdf = async () => {
    if (!activeResume) return;
    setIsExportingPdf(true);
    toast.info('Generating ATS-Optimized PDF...', 'Compiling recruiter-ready single-column PDF');

    try {
      const bullets = activeResume.last_analysis?.bullet_rewrites?.map((b) => b.suggested) || [];
      const extractedSkills = (activeResume.last_analysis?.gap_keywords || [])
        .map((k: any) => (typeof k === 'string' ? k : k.keyword || ''))
        .filter(Boolean);

      await analysisApi.exportResumePdf({
        target_role: activeResume.target_role || activeTitle || 'Engineer',
        summary: editedText.trim().slice(0, 400),
        experience: [
          {
            title: activeResume.target_role || 'Lead Engineer',
            company: 'Track Record & Projects',
            bullets: bullets.length > 0 ? bullets : [editedText.trim()],
          },
        ],
        skills: extractedSkills.length > 0 ? extractedSkills : ['Python', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Docker'],
      });
      toast.success('ATS Resume PDF Downloaded!');
    } catch (err: any) {
      toast.error('PDF Generation Failed', err?.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const wordCount = editedText.trim() ? editedText.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      <JobSearchBar />

      {/* Main Workspace Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Multi-Resume Role Vault Manager Bar */}
        <ResumeVaultManager
          resumes={resumes}
          selectedResumeId={selectedResumeId}
          onSelectResume={handleSelectResume}
          onCreateResume={(payload) => createResume(payload)}
          onDeleteResume={(id) => deleteResume(id)}
          onSetPrimary={(id) => setPrimaryResume(id)}
          onExportPdf={handleExportPdf}
          isExporting={isExportingPdf}
          activeRole={activeTitle || 'AI Engineer'}
          onSelectRole={(role) => setActiveTitle(role)}
        />

        {/* Dual-Column Interactive Studio (Active when >= 1 resume in vault) */}
        {activeResume ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (5 Cols): Active Resume Editor, Project Recommendations, JD Heatmap */}
            <div className="lg:col-span-5 space-y-6">
              {/* Live Resume Editor Card */}
              <Card className="glass-card border-border/40 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/30 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
                        <FileText className="h-4 w-4" />
                      </div>
                      {activeResume?.title || 'Resume Content'}
                    </CardTitle>

                    <div className="flex items-center gap-2">
                      {hasUnsavedChanges && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-300 border-amber-500/30">
                          Unsaved Edits
                        </Badge>
                      )}
                      <Button
                        size="xs"
                        onClick={handleSaveText}
                        disabled={!hasUnsavedChanges || isUpdating}
                        className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold gap-1"
                      >
                        <Save className="h-3 w-3" />
                        {isUpdating ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  <textarea
                    rows={14}
                    value={editedText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Paste or edit your resume text here..."
                    className="w-full p-3.5 text-xs font-mono rounded-xl border border-border/40 bg-slate-950/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner leading-relaxed"
                  />

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>
                      {wordCount} words • {editedText.length} chars
                    </span>
                    <span className="text-indigo-300">
                      Target: {activeResume?.target_role || activeTitle}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Featured GitHub Project Recommendations */}
              <ProjectRecommendations
                projects={activeResume?.last_analysis?.recommended_projects}
                targetRole={activeResume?.target_role || activeTitle}
                onInsertBullets={handleInsertBullets}
              />

              {/* Live Job Description Keyword Cloud & Skill Heatmap */}
              <JDKeywordCloud />
              <GapHeatmap />
            </div>

            {/* Right Column (7 Cols): The Resume Destroyer Teardown & Reconstruction */}
            <div className="lg:col-span-7 space-y-6">
              <ResumeDestroyerCard
                audit={activeResume?.last_analysis}
                isLoading={isAnalyzing}
                onAnalyze={handleRunDestroyer}
                targetRole={activeResume?.target_role || activeTitle}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <JDKeywordCloud />
            <GapHeatmap />
          </div>
        )}
      </div>
    </div>
  );
}
