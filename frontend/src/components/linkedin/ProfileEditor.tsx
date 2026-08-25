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
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton count={3} />
      </div>
    );
  }

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
            Upload your LinkedIn Data Export ZIP file in the panel on the right to parse and score your career sections.
          </p>
        </div>
      </div>
    );
  }

  const getSectionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'headline':
      case 'about':
        return User;
      case 'experience':
        return Briefcase;
      case 'education':
        return GraduationCap;
      case 'skills':
        return Code;
      default:
        return Award;
    }
  };

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
            `Saved changes to ${sec.title || sec.section_type}`
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

  const allSectionIds = profile.sections.map((s) => s.id);
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

    switch (sec.section_type.toLowerCase()) {
      case 'headline':
        return (
          <HeadlineEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'about':
        return (
          <AboutEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'experience':
        return (
          <ExperienceEditor
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
      case 'education':
      case 'certifications':
        return (
          <EducationEditor
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

  return (
    <div className="space-y-4">
      {/* Editor Top Toolbar */}
      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-secondary/30 border border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[11px] font-semibold">
            {profile.sections.length} Sections
          </Badge>
          <button
            onClick={() => setAllSectionsExpanded(!allExpanded, allSectionIds)}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            {allExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Visual vs Raw JSON Mode Toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-border/40 text-xs">
          <button
            onClick={() => setViewMode('visual')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all select-none',
              viewMode === 'visual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Eye className="h-3 w-3" />
            Visual Form
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all select-none',
              viewMode === 'raw'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Braces className="h-3 w-3" />
            JSON Inspector
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {profile.sections.map((sec) => {
          const Icon = getSectionIcon(sec.section_type);
          const isEditing = editingId === sec.id;
          const isExpanded = expandedSections[sec.id] ?? true;
          const dirty = isSectionDirty(sec.id, sec.content);

          return (
            <Card
              key={sec.id}
              className={cn(
                'glass-card border-border/40 overflow-hidden shadow-xl transition-all duration-200',
                isEditing ? 'border-indigo-500/50 shadow-glow' : 'hover:border-border/70'
              )}
            >
              {/* Section Header */}
              <div className="p-4 border-b border-border/30 bg-secondary/30 flex items-center justify-between gap-3">
                <div
                  className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                  onClick={() => toggleSectionExpanded(sec.id)}
                >
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm capitalize text-foreground flex items-center gap-2">
                      <span className="truncate">{sec.title || sec.section_type}</span>
                      <SectionScore score={sec.ai_score} />
                      {dirty && (
                        <Badge variant="warning" className="text-[9px] px-1.5 py-0">
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
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
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
                        isLoading={isPending}
                        onClick={() => handleSaveSection(sec)}
                        className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Section
                      </Button>
                    </div>
                  )}

                  <button
                    onClick={() => toggleSectionExpanded(sec.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors ml-1"
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
