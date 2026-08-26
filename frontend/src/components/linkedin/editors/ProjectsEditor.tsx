import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderGit2, Plus, Trash2, ExternalLink, Calendar } from 'lucide-react';

interface Project {
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
  const getProjects = (): Project[] => {
    if (Array.isArray(content)) return content;
    if (content?.projects && Array.isArray(content.projects)) return content.projects;
    if (content?.title || content?.name) return [content];
    return [];
  };

  const projects = getProjects();

  const handleUpdate = (idx: number, updated: Project) => {
    const next = [...projects];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, projects: next });
  };

  const handleAdd = () => {
    const newProj: Project = {
      title: 'New Technical Project',
      description: 'Architected high-throughput services with modern tech stack.',
      url: 'https://github.com/username/project',
      start_date: '2024',
      end_date: 'Present',
    };
    if (Array.isArray(content)) onChange([newProj, ...projects]);
    else onChange({ ...content, projects: [newProj, ...projects] });
  };

  const handleRemove = (idx: number) => {
    const next = projects.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, projects: next });
  };

  if (projects.length === 0 && !isEditing) {
    return null;
  }

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Project
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((proj, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/60 border border-border/40 space-y-2.5 hover:border-border/70 transition-all shadow-sm"
          >
            {isEditing ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={proj.title || proj.name || ''}
                    onChange={(e) => handleUpdate(idx, { ...proj, title: e.target.value })}
                    placeholder="Project Title"
                    className="font-bold text-xs bg-slate-900"
                  />
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleRemove(idx)}
                    className="text-rose-400 hover:bg-rose-500/10 h-7"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input
                  value={proj.url || ''}
                  onChange={(e) => handleUpdate(idx, { ...proj, url: e.target.value })}
                  placeholder="Project URL (e.g. https://github.com/...)"
                  className="text-xs bg-slate-900"
                />
                <textarea
                  rows={3}
                  value={proj.description || ''}
                  onChange={(e) => handleUpdate(idx, { ...proj, description: e.target.value })}
                  placeholder="Project architecture description and metrics..."
                  className="w-full p-2.5 text-xs font-sans rounded-xl border border-border/40 bg-slate-900 text-foreground resize-none"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                      <FolderGit2 className="h-3.5 w-3.5 text-purple-400" />
                      {proj.title || proj.name || 'Untitled Project'}
                    </h5>
                    {(proj.start_date || proj.end_date) && (
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {proj.start_date || ''} {proj.end_date ? `– ${proj.end_date}` : ''}
                      </span>
                    )}
                  </div>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Link
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line font-sans">
                    {proj.description}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
