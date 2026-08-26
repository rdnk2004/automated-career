import { useState, useMemo } from 'react';
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
  'experience',
  'education',
  'certifications',
  'projects',
  'skills',
  'volunteer',
  'awards',
  'languages',
];

interface ConsolidatedSection {
  id: string;
  section_type: string;
  title: string;
  content: any;
  ai_score?: number;
  item_count: number;
}

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

  // Group and consolidate all raw DB rows into unified domain sections
  const consolidatedSections = useMemo((): ConsolidatedSection[] => {
    if (!profile || !profile.sections) return [];

    const groupMap: Record<string, { sections: any[]; items: any[] }> = {};

    profile.sections.forEach((sec) => {
      let normType = sec.section_type.toLowerCase();
      if (normType === 'positions') normType = 'experience';
      if (normType === 'summary') normType = 'about';
      if (normType === 'volunteering') normType = 'volunteer';
      if (normType === 'honors') normType = 'awards';

      if (!groupMap[normType]) {
        groupMap[normType] = { sections: [], items: [] };
      }
      groupMap[normType].sections.push(sec);

      const c = sec.content;
      if (!c) return;

      if (normType === 'certifications') {
        if (Array.isArray(c)) groupMap[normType].items.push(...c);
        else if (c.certifications && Array.isArray(c.certifications)) groupMap[normType].items.push(...c.certifications);
        else if (c.name || c.authority || c.title || sec.title) groupMap[normType].items.push(c.name ? c : { name: sec.title, ...c });
      } else if (normType === 'projects') {
        if (Array.isArray(c)) groupMap[normType].items.push(...c);
        else if (c.projects && Array.isArray(c.projects)) groupMap[normType].items.push(...c.projects);
        else if (c.title || c.name || sec.title) groupMap[normType].items.push(c.title ? c : { title: sec.title, ...c });
      } else if (normType === 'experience') {
        if (Array.isArray(c)) groupMap[normType].items.push(...c);
        else if (c.positions && Array.isArray(c.positions)) groupMap[normType].items.push(...c.positions);
        else if (c.title || c.company || sec.title) groupMap[normType].items.push(c.title ? c : { title: sec.title, ...c });
      } else if (normType === 'education') {
        if (Array.isArray(c)) groupMap[normType].items.push(...c);
        else if (c.education && Array.isArray(c.education)) groupMap[normType].items.push(...c.education);
        else if (c.degree || c.school || sec.title) groupMap[normType].items.push(c.degree ? c : { degree: sec.title, ...c });
      } else if (normType === 'skills') {
        if (Array.isArray(c)) groupMap[normType].items.push(...c.map((s: any) => (typeof s === 'string' ? s : s.name || '')));
        else if (c.skills && Array.isArray(c.skills)) groupMap[normType].items.push(...c.skills.map((s: any) => (typeof s === 'string' ? s : s.name || '')));
      } else if (normType === 'volunteer') {
        if (Array.isArray(c)) groupMap[normType].items.push(...c);
        else if (c.volunteer && Array.isArray(c.volunteer)) groupMap[normType].items.push(...c.volunteer);
        else if (c.role || c.organization || sec.title) groupMap[normType].items.push(c);
      } else if (normType === 'awards') {
        if (Array.isArray(c)) groupMap[normType].items.push(...c);
        else if (c.awards && Array.isArray(c.awards)) groupMap[normType].items.push(...c.awards);
        else if (c.honors && Array.isArray(c.honors)) groupMap[normType].items.push(...c.honors);
        else if (c.title || c.issuer || sec.title) groupMap[normType].items.push(c);
      } else if (normType === 'languages') {
        if (Array.isArray(c)) groupMap[normType].items.push(...c);
        else if (c.languages && Array.isArray(c.languages)) groupMap[normType].items.push(...c.languages);
        else if (c.name || sec.title) groupMap[normType].items.push(c);
      } else {
        groupMap[normType].items.push(c);
      }
    });

    const results: ConsolidatedSection[] = [];

    // Process each category in strict LinkedIn order
    SECTION_ORDER.forEach((catType) => {
      const entry = groupMap[catType];
      if (!entry || entry.sections.length === 0) return;

      const primarySec = entry.sections[0];
      const avgScore = Math.round(
        entry.sections.reduce((acc, s) => acc + (s.ai_score || 78), 0) / entry.sections.length
      );

      if (catType === 'headline') {
        const c = primarySec.content || {};
        const text = c.headline || c.text || (typeof c === 'string' ? c : '');
        if (!text && !c.location) return;
        results.push({
          id: primarySec.id,
          section_type: 'headline',
          title: 'Headline & Location',
          content: typeof c === 'object' ? { headline: text, location: c.location || '', ...c } : { headline: text },
          ai_score: avgScore,
          item_count: 1,
        });
      } else if (catType === 'about') {
        const c = primarySec.content || {};
        const summary = c.summary || c.text || (typeof c === 'string' ? c : '');
        if (!summary.trim()) return;
        results.push({
          id: primarySec.id,
          section_type: 'about',
          title: 'Executive Summary',
          content: { summary: summary, text: summary },
          ai_score: avgScore,
          item_count: 1,
        });
      } else if (catType === 'certifications') {
        if (entry.items.length === 0) return;
        results.push({
          id: primarySec.id,
          section_type: 'certifications',
          title: 'Certifications & Licenses',
          content: { certifications: entry.items },
          ai_score: avgScore,
          item_count: entry.items.length,
        });
      } else if (catType === 'projects') {
        if (entry.items.length === 0) return;
        results.push({
          id: primarySec.id,
          section_type: 'projects',
          title: 'Technical Projects',
          content: { projects: entry.items },
          ai_score: avgScore,
          item_count: entry.items.length,
        });
      } else if (catType === 'experience') {
        if (entry.items.length === 0) return;
        results.push({
          id: primarySec.id,
          section_type: 'experience',
          title: 'Work Experience',
          content: { positions: entry.items },
          ai_score: avgScore,
          item_count: entry.items.length,
        });
      } else if (catType === 'education') {
        if (entry.items.length === 0) return;
        results.push({
          id: primarySec.id,
          section_type: 'education',
          title: 'Education',
          content: { education: entry.items },
          ai_score: avgScore,
          item_count: entry.items.length,
        });
      } else if (catType === 'skills') {
        const uniqueSkills = Array.from(new Set(entry.items.filter(Boolean)));
        if (uniqueSkills.length === 0) return;
        results.push({
          id: primarySec.id,
          section_type: 'skills',
          title: 'Technical Skills',
          content: { skills: uniqueSkills },
          ai_score: avgScore,
          item_count: uniqueSkills.length,
        });
      } else if (catType === 'volunteer') {
        if (entry.items.length === 0) return;
        results.push({
          id: primarySec.id,
          section_type: 'volunteer',
          title: 'Volunteering Experience',
          content: { volunteer: entry.items },
          ai_score: avgScore,
          item_count: entry.items.length,
        });
      } else if (catType === 'awards') {
        if (entry.items.length === 0) return;
        results.push({
          id: primarySec.id,
          section_type: 'awards',
          title: 'Honors & Awards',
          content: { awards: entry.items },
          ai_score: avgScore,
          item_count: entry.items.length,
        });
      } else if (catType === 'languages') {
        if (entry.items.length === 0) return;
        results.push({
          id: primarySec.id,
          section_type: 'languages',
          title: 'Languages',
          content: { languages: entry.items },
          ai_score: avgScore,
          item_count: entry.items.length,
        });
      }
    });

    return results;
  }, [profile]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton count={3} />
      </div>
    );
  }

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
      case 'certifications':
        return Award;
      case 'projects':
        return FolderGit2;
      case 'skills':
        return Code;
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

  const getItemCountBadge = (type: string, count: number) => {
    switch (type.toLowerCase()) {
      case 'certifications':
        return `${count} ${count === 1 ? 'Credential' : 'Credentials'}`;
      case 'projects':
        return `${count} ${count === 1 ? 'Project' : 'Projects'}`;
      case 'experience':
        return `${count} ${count === 1 ? 'Role' : 'Roles'}`;
      case 'education':
        return `${count} ${count === 1 ? 'Degree' : 'Degrees'}`;
      case 'skills':
        return `${count} Skills`;
      case 'volunteer':
        return `${count} ${count === 1 ? 'Activity' : 'Activities'}`;
      case 'awards':
        return `${count} ${count === 1 ? 'Honor' : 'Honors'}`;
      case 'languages':
        return `${count} ${count === 1 ? 'Language' : 'Languages'}`;
      default:
        return null;
    }
  };

  if (!profile || consolidatedSections.length === 0) {
    return (
      <div className="p-10 glass-card rounded-3xl border border-dashed border-border/50 text-center text-muted-foreground space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-glow">
          <FileText className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold font-heading text-foreground text-base">
            No LinkedIn Profile Data Imported
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Upload your LinkedIn Data Export ZIP file in the panel above to parse and organize your career sections into clean accordions.
          </p>
        </div>
      </div>
    );
  }

  const handleStartEdit = (sec: ConsolidatedSection) => {
    setEditingId(sec.id);
    setDraftContent(sec.id, sec.content);
  };

  const handleCancelEdit = (secId: string) => {
    clearDraft(secId);
    setEditingId(null);
  };

  const handleSaveSection = (sec: ConsolidatedSection) => {
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
          toast.success('Section Updated', `Saved changes to ${sec.title}`);
        },
        onError: (err: any) => {
          toast.error('Save Failed', err?.message || 'Failed to update section');
        },
      }
    );
  };

  const allSectionIds = consolidatedSections.map((s) => s.id);
  const allExpanded = allSectionIds.every((id) => expandedSections[id] ?? true);

  const renderSectionEditor = (sec: ConsolidatedSection, isEditing: boolean) => {
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
        return (
          <AboutEditor
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
      case 'projects':
        return (
          <ProjectsEditor
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
      case 'education':
        return (
          <EducationEditor
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
      case 'volunteer':
        return (
          <VolunteerEditor
            content={currentContent}
            onChange={handleContentChange}
            isEditing={isEditing}
          />
        );
      case 'awards':
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
            {consolidatedSections.length} Domain Categories
          </Badge>
          <button
            onClick={() => setAllSectionsExpanded(!allExpanded, allSectionIds)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors font-medium"
          >
            {allExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {allExpanded ? 'Collapse All Categories' : 'Unwrap All Categories'}
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
              Add Category
            </Button>

            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-950 border border-border/60 shadow-2xl p-1.5 z-50 space-y-1 text-xs animate-fade-in">
                <button
                  onClick={() => handleAddNewSection('certifications', 'Certifications & Licenses', { certifications: [] })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  Certifications
                </button>
                <button
                  onClick={() => handleAddNewSection('projects', 'Technical Projects', { projects: [] })}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <FolderGit2 className="h-3.5 w-3.5 text-purple-400" />
                  Projects
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
        {consolidatedSections.map((sec) => {
          const Icon = getSectionIcon(sec.section_type);
          const isEditing = editingId === sec.id;
          const isExpanded = expandedSections[sec.id] ?? true;
          const dirty = isSectionDirty(sec.id, sec.content);
          const countBadge = getItemCountBadge(sec.section_type, sec.item_count);

          return (
            <Card
              key={sec.id}
              className={cn(
                'glass-card border-border/40 overflow-hidden shadow-lg transition-all duration-200 rounded-3xl',
                isEditing ? 'border-indigo-500/60 shadow-glow ring-1 ring-indigo-500/30' : 'hover:border-border/70'
              )}
            >
              {/* Primary Category Header */}
              <div className="p-4 sm:p-5 border-b border-border/30 bg-secondary/30 flex items-center justify-between gap-3">
                <div
                  className="flex items-center gap-3.5 cursor-pointer select-none flex-1 min-w-0"
                  onClick={() => toggleSectionExpanded(sec.id)}
                >
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2.5 flex-wrap">
                      <span className="truncate">{sec.title}</span>
                      {countBadge && (
                        <Badge variant="outline" className="text-[10px] bg-slate-900 text-indigo-300 border-indigo-500/25 font-mono">
                          {countBadge}
                        </Badge>
                      )}
                      <SectionScore score={sec.ai_score} />
                      {dirty && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-300 border-amber-500/30 font-mono">
                          Unsaved
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider pt-0.5 block">
                      Category • {sec.section_type}
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
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit All
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelEdit(sec.id)}
                        className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground rounded-xl"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSaveSection(sec)}
                        className="h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 font-semibold rounded-xl"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Changes
                      </Button>
                    </div>
                  )}

                  <button
                    onClick={() => toggleSectionExpanded(sec.id)}
                    className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    aria-label={isExpanded ? 'Collapse category' : 'Unwrap category'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Category Body (Sub-sections Accordion) */}
              {isExpanded && (
                <div className="p-4 sm:p-6 animate-fade-in bg-slate-950/20">
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
