import { useState } from 'react';
import { useProfile, useUpdateSection } from '@/hooks/useProfile';
import { useProfileStore } from '@/stores/profileStore';
import { toast } from '@/hooks/useToast';
import { SectionScore } from './SectionScore';
import { HeadlineEditor } from './editors/HeadlineEditor';
import { AboutEditor } from './editors/AboutEditor';
import { ExperienceEditor } from './editors/ExperienceEditor';
import { SkillsEditor } from './editors/SkillsEditor';
import { EducationEditor } from './editors/EducationEditor';
import { ProjectsEditor } from './editors/ProjectsEditor';
import { CertificationsEditor } from './editors/CertificationsEditor';
import { VolunteerEditor } from './editors/VolunteerEditor';
import { AwardsEditor } from './editors/AwardsEditor';
import { LanguagesEditor } from './editors/LanguagesEditor';
import { RawJsonEditor } from './editors/RawJsonEditor';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Edit3,
  Save,
  X,
  FileText,
  Eye,
  Braces,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  HeartHandshake,
  Trophy,
  Languages,
  Plus,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Ordered standard hierarchy of LinkedIn profile sections
const SECTION_ORDER = [
  'headline',
  'about',
  'summary',
  'experience',
  'positions',
  'education',
  'certifications',
  'projects',
  'skills',
  'volunteer',
  'awards',
  'honors',
  'languages',
];

export function ProfileEditor() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateSection, isPending } = useUpdateSection();
  const {
    viewMode,
    setViewMode,
    draftEdits,
    setDraftContent,
    clearDraft,
    expandedSections,
    toggleSectionExpanded,
    setAllSectionsExpanded,
    isSectionDirty,
  } = useProfileStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton count={3} />
      </div>
    );
  }

  // Check if a section has real data (hide empty ones)
  const hasSectionData = (sec: any): boolean => {
    if (!sec || !sec.content) return false;
    const c = sec.content;
    if (typeof c === 'string') return c.trim().length > 0;
    if (Array.isArray(c)) return c.length > 0;
    if (typeof c === 'object') {
      if (c.text && typeof c.text === 'string' && c.text.trim()) return true;
      if (c.headline && typeof c.headline === 'string' && c.headline.trim()) return true;
      if (c.summary && typeof c.summary === 'string' && c.summary.trim()) return true;
      if (c.skills && Array.isArray(c.skills) && c.skills.length > 0) return true;
      if (c.positions && Array.isArray(c.positions) && c.positions.length > 0) return true;
      if (c.education && Array.isArray(c.education) && c.education.length > 0) return true;
      if (c.projects && Array.isArray(c.projects) && c.projects.length > 0) return true;
      if (c.certifications && Array.isArray(c.certifications) && c.certifications.length > 0) return true;
      if (c.volunteer && Array.isArray(c.volunteer) && c.volunteer.length > 0) return true;
      if (c.awards && Array.isArray(c.awards) && c.awards.length > 0) return true;
      if (c.honors && Array.isArray(c.honors) && c.honors.length > 0) return true;
      if (c.languages && Array.isArray(c.languages) && c.languages.length > 0) return true;
      if (c.title || c.company || c.school || c.name || c.degree || c.role) return true;
      // If object has non-empty keys
      const values = Object.values(c).filter(Boolean);
      return values.length > 0;
    }
    return false;
  };

  const getSectionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'headline':
        return User;
      case 'about':
      case 'summary':
        return FileText;
      case 'experience':
      case 'positions':
        return Briefcase;
      case 'education':
        return GraduationCap;
      case 'projects':
        return FolderGit2;
      case 'skills':
        return Code;
      case 'certifications':
        return Award;
      case 'volunteer':
      case 'volunteering':
        return HeartHandshake;
      case 'awards':
      case 'honors':
        return Trophy;
      case 'languages':
        return Languages;
      default:
        return Sparkles;
    }
  };

  const getSectionFriendlyTitle = (type: string, title?: string) => {
    switch (type.toLowerCase()) {
      case 'headline':
        return 'Headline & Location';
      case 'about':
      case 'summary':
        return 'Summary';
      case 'experience':
      case 'positions':
        return title || 'Work Experience';
      case 'education':
        return title || 'Education';
      case 'projects':
        return title || 'Projects';
      case 'skills':
        return 'Technical Skills';
      case 'certifications':
        return title || 'Certifications & Licenses';
      case 'volunteer':
      case 'volunteering':
        return title || 'Volunteering Experience';
      case 'awards':
      case 'honors':
        return title || 'Honors & Awards';
      case 'languages':
        return 'Languages';
      default:
        return title || type;
    }
  };

  if (!profile || !profile.sections || profile.sections.length === 0) {
    return (
      <div className="p-10 glass-card rounded-2xl border border-dashed border-border/50 text-center text-muted-foreground space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-glow">
          <FileText className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold font-heading text-foreground text-base">
            No LinkedIn Profile Data Imported
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Upload your LinkedIn Data Export ZIP file in the panel above to parse and display all your career sections.
          </p>
        </div>
      </div>
    );
  }

  // Filter only sections with real data (hide empty sections)
  const validSections = profile.sections.filter((s) => hasSectionData(s) || editingId === s.id);

  // Sort sections according to the standard LinkedIn hierarchy
  const sortedSections = [...validSections].sort((a, b) => {
    const aType = a.section_type.toLowerCase();
    const bType = b.section_type.toLowerCase();
    const aIdx = SECTION_ORDER.indexOf(aType);
    const bIdx = SECTION_ORDER.indexOf(bType);
    const aRank = aIdx !== -1 ? aIdx : 99;
    const bRank = bIdx !== -1 ? bIdx : 99;
    return aRank - bRank;
  });

  const handleStartEdit = (sec: any) => {
    setEditingId(sec.id);
    setDraftContent(sec.id, sec.content);
  };

  const handleCancelEdit = (secId: string) => {
    clearDraft(secId);
    setEditingId(null);
  };

  const handleSaveSection = (sec: any) => {
    const draft = draftEdits[sec.id] !== undefined ? draftEdits[sec.id] : sec.content;
    updateSection(
      {
        section_type: sec.section_type,
        title: sec.title,
        content: draft,
      },
      {
        onSuccess: () => {
          clearDraft(sec.id);
          setEditingId(null);
          toast.success(
            'Section Updated',
            `Saved changes to ${getSectionFriendlyTitle(sec.section_type, sec.title)}`
          );
        },
        onError: (err: any) => {
          toast.error(
            'Save Failed',
            err?.message || 'Failed to update profile section'
          );
        },
      }
    );
  };

  const allSectionIds = sortedSections.map((s) => s.id);
  const allExpanded = allSectionIds.every((id) => expandedSections[id] ?? true);

  const renderSectionEditor = (sec: any, isEditing: boolean) => {
    const currentContent = draftEdits[sec.id] !== undefined ? draftEdits[sec.id] : sec.content;
    const handleContentChange = (updated: any) => setDraftContent(sec.id, updated);

    if (viewMode === 'raw') {
      return (
        <RawJsonEditor
          content={currentContent}
          onChange={handleContentChange}
          isEditing={isEditing}
        />
      );
    }

    const type = sec.section_type.toLowerCase();
    switch (type) {
      case 'headline':
        return (
          <HeadlineEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'about':
      case 'summary':
        return (
          <AboutEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'experience':
      case 'positions':
        return (
          <ExperienceEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'education':
        return (
          <EducationEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'projects':
        return (
          <ProjectsEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'skills':
        return (
          <SkillsEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'certifications':
        return (
          <CertificationsEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'volunteer':
      case 'volunteering':
        return (
          <VolunteerEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'awards':
      case 'honors':
        return (
          <AwardsEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'languages':
        return (
          <LanguagesEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      default:
        return (
          <RawJsonEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
    }
  };

  const handleAddNewSection = (type: string, title: string, defaultContent: any) => {
    setShowAddMenu(false);
    updateSection(
      {
        section_type: type,
        title: title,
        content: defaultContent,
      },
      {
        onSuccess: () => {
          toast.success('Section Added', `Created new ${title} section`);
        },
        onError: (err: any) => {
          toast.error('Add Failed', err?.message);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Editor Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs font-semibold px-2.5 py-1"
          >
            {sortedSections.length} Active Sections
          </Badge>
          <button
            onClick={() => setAllSectionsExpanded(!allExpanded, allSectionIds)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors font-medium"
          >
            {allExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* View Mode Toggle & Add Section */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-border/40 text-xs">
            <button
              onClick={() => setViewMode('visual')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all select-none',
                viewMode === 'visual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Visual
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all select-none',
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Braces className="h-3.5 w-3.5" />
              JSON
            </button>
          </div>

          <div className="relative">
            <Button
              size="xs"
              variant="outline"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="h-7 text-xs border-border/40 text-muted-foreground hover:text-foreground gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Section
            </Button>

            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-950 border border-border/60 shadow-2xl p-1.5 z-50 space-y-1 text-xs animate-fade-in">
                <button
                  onClick={() => handleAddNewSection('projects', 'Projects', { projects: [] })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <FolderGit2 className="h-3.5 w-3.5 text-purple-400" />
                  Projects
                </button>
                <button
                  onClick={() => handleAddNewSection('certifications', 'Certifications', { certifications: [] })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  Certifications
                </button>
                <button
                  onClick={() => handleAddNewSection('volunteer', 'Volunteer Experience', { volunteer: [] })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <HeartHandshake className="h-3.5 w-3.5 text-rose-400" />
                  Volunteer Experience
                </button>
                <button
                  onClick={() => handleAddNewSection('awards', 'Honors & Awards', { awards: [] })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                  Honors & Awards
                </button>
                <button
                  onClick={() => handleAddNewSection('languages', 'Languages', { languages: [] })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Languages className="h-3.5 w-3.5 text-indigo-400" />
                  Languages
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sections List in Strict LinkedIn Order */}
      <div className="space-y-4">
        {sortedSections.map((sec) => {
          const Icon = getSectionIcon(sec.section_type);
          const isEditing = editingId === sec.id;
          const isExpanded = expandedSections[sec.id] ?? true;
          const dirty = isSectionDirty(sec.id, sec.content);
          const friendlyTitle = getSectionFriendlyTitle(sec.section_type, sec.title);

          return (
            <Card
              key={sec.id}
              className={cn(
                'glass-card border-border/40 overflow-hidden shadow-lg transition-all duration-200 rounded-2xl',
                isEditing ? 'border-indigo-500/60 shadow-glow ring-1 ring-indigo-500/30' : 'hover:border-border/70'
              )}
            >
              {/* Section Header */}
              <div className="p-4 border-b border-border/30 bg-secondary/30 flex items-center justify-between gap-3">
                <div
                  className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                  onClick={() => toggleSectionExpanded(sec.id)}
                >
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm capitalize text-foreground flex items-center gap-2">
                      <span className="truncate">{friendlyTitle}</span>
                      <SectionScore score={sec.ai_score} />
                      {dirty && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-300 border-amber-500/30 font-mono">
                          Unsaved
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                      {sec.section_type}
                    </span>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(sec)}
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelEdit(sec.id)}
                        className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSaveSection(sec)}
                        className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 font-semibold"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </Button>
                    </div>
                  )}

                  <button
                    onClick={() => toggleSectionExpanded(sec.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Section Body */}
              {isExpanded && (
                <div className="p-4 sm:p-5 animate-fade-in">
                  {renderSectionEditor(sec, isEditing)}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
