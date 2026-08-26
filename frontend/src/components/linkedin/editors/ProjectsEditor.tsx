import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FolderGit2,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProjectItem {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
  start_date?: string;
  end_date?: string;
}

export function ProjectsEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const getProjects = (): ProjectItem[] => {
    if (Array.isArray(content)) return content;
    if (content?.projects && Array.isArray(content.projects)) return content.projects;
    if (content?.title || content?.name) return [content];
    return [];
  };

  const projects = getProjects();
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({ 0: true });
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const toggleUnwrap = (idx: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleUpdate = (idx: number, updated: ProjectItem) => {
    const next = [...projects];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, projects: next });
  };

  const handleAdd = () => {
    const newProj: ProjectItem = {
      title: 'New Technical Project',
      description: 'Architected high-throughput services with modern engineering patterns.',
      url: 'https://github.com/username/project',
      start_date: '2024',
      end_date: 'Present',
    };
    const next = [newProj, ...projects];
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, projects: next });
    setExpandedIds((prev) => ({ ...prev, 0: true }));
    setEditingItemIdx(0);
  };

  const handleRemove = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = projects.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, projects: next });
    if (editingItemIdx === idx) setEditingItemIdx(null);
  };

  if (projects.length === 0 && !isEditing) {
    return (
      <div className="p-6 rounded-2xl bg-slate-950/40 border border-border/40 text-center text-xs text-muted-foreground italic">
        No projects listed.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-muted-foreground">
          {projects.length} {projects.length === 1 ? 'Project' : 'Projects'} Showcased
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const allOpen = projects.every((_, i) => expandedIds[i]);
              const nextState: Record<number, boolean> = {};
              projects.forEach((_, i) => {
                nextState[i] = !allOpen;
              });
              setExpandedIds(nextState);
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium px-2 py-0.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {projects.every((_, i) => expandedIds[i]) ? 'Collapse All' : 'Unwrap All'}
          </button>

          <Button
            size="xs"
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs gap-1 h-7"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Sub-sections List: Each project is an unwrappable item */}
      <div className="space-y-2.5">
        {projects.map((proj, idx) => {
          const isExpanded = expandedIds[idx] ?? false;
          const isItemEditing = isEditing || editingItemIdx === idx;
          const projTitle = proj.title || proj.name || 'Untitled Project';
          const projDates = (proj.start_date || proj.end_date)
            ? `${proj.start_date || ''} ${proj.end_date ? `– ${proj.end_date}` : ''}`
            : '';

          return (
            <div
              key={idx}
              className={cn(
                'rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm',
                isExpanded
                  ? 'bg-slate-900/90 border-purple-500/30'
                  : 'bg-slate-950/60 border-border/40 hover:border-border/70'
              )}
            >
              {/* Unwrappable Project Name Header */}
              <div
                onClick={() => toggleUnwrap(idx)}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                    <FolderGit2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                      {projTitle}
                    </h5>
                    {projDates && (
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 pt-0.5">
                        <Calendar className="h-3 w-3" />
                        {projDates}
                      </span>
                    )}
                  </div>
                </div>

                {/* Header Actions & Chevron */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {proj.url && !isItemEditing && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg flex items-center gap-1 transition-colors mr-1"
                      title="Open Project Link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => {
                      if (!isExpanded) toggleUnwrap(idx);
                      setEditingItemIdx(editingItemIdx === idx ? null : idx);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                    title={isItemEditing ? 'Done Editing' : 'Edit Project'}
                  >
                    {isItemEditing ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Edit2 className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={(e) => handleRemove(idx, e)}
                    className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => toggleUnwrap(idx)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                    aria-label={isExpanded ? 'Collapse' : 'Unwrap'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-purple-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Unwrapped Project Details (Description & Links) */}
              {isExpanded && (
                <div className="p-4 border-t border-border/30 bg-slate-950/40 animate-fade-in space-y-3">
                  {isItemEditing ? (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Project Title
                          </label>
                          <Input
                            value={proj.title || proj.name || ''}
                            onChange={(e) => handleUpdate(idx, { ...proj, title: e.target.value, name: e.target.value })}
                            placeholder="e.g. Career OS - Autonomous Career Suite"
                            className="font-bold text-xs bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Timeline / Dates
                          </label>
                          <Input
                            value={projDates}
                            onChange={(e) => handleUpdate(idx, { ...proj, start_date: e.target.value, end_date: '' })}
                            placeholder="e.g. 2024 – Present"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Project URL / Repository Link
                        </label>
                        <Input
                          value={proj.url || ''}
                          onChange={(e) => handleUpdate(idx, { ...proj, url: e.target.value })}
                          placeholder="https://github.com/..."
                          className="text-xs bg-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Project Description & Architecture Details
                        </label>
                        <textarea
                          rows={3}
                          value={proj.description || ''}
                          onChange={(e) => handleUpdate(idx, { ...proj, description: e.target.value })}
                          placeholder="Describe the architecture, systems impact, tools used, and performance metrics..."
                          className="w-full p-2.5 text-xs font-sans rounded-xl border border-border/40 bg-slate-900 text-foreground resize-y leading-relaxed focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {proj.description ? (
                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line font-sans">
                          {proj.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          No project description provided. Click Edit to add details.
                        </p>
                      )}

                      {proj.url && (
                        <div className="pt-1.5 border-t border-border/20 flex items-center justify-between">
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {proj.url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
