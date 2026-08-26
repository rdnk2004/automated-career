import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GraduationCap,
  Plus,
  Trash2,
  Building2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EducationItem {
  degree?: string;
  school?: string;
  start_date?: string;
  end_date?: string;
  started_on?: string;
  ended_on?: string;
  field?: string;
  notes?: string;
}

export function EducationEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const getItems = (): EducationItem[] => {
    if (Array.isArray(content)) return content;
    if (content?.education && Array.isArray(content.education)) return content.education;
    if (content?.degree || content?.school) return [content];
    return [];
  };

  const items = getItems();
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({ 0: true });
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const toggleUnwrap = (idx: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleUpdate = (idx: number, updated: EducationItem) => {
    const next = [...items];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, education: next });
  };

  const handleAdd = () => {
    const newItem: EducationItem = {
      degree: 'B.S. in Computer Science',
      school: 'University Name',
      start_date: '2020',
      end_date: '2024',
      notes: 'Focus on Artificial Intelligence & Software Systems',
    };
    const next = [newItem, ...items];
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, education: next });
    setExpandedIds((prev) => ({ ...prev, 0: true }));
    setEditingItemIdx(0);
  };

  const handleRemove = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = items.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, education: next });
    if (editingItemIdx === idx) setEditingItemIdx(null);
  };

  if (items.length === 0 && !isEditing) {
    return (
      <div className="p-6 rounded-2xl bg-slate-950/40 border border-border/40 text-center text-xs text-muted-foreground italic">
        No academic education listed.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? 'Degree / Program' : 'Degrees / Programs'}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const allOpen = items.every((_, i) => expandedIds[i]);
              const nextState: Record<number, boolean> = {};
              items.forEach((_, i) => {
                nextState[i] = !allOpen;
              });
              setExpandedIds(nextState);
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium px-2 py-0.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {items.every((_, i) => expandedIds[i]) ? 'Collapse All' : 'Unwrap All'}
          </button>

          <Button
            size="xs"
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs gap-1 h-7"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Education
          </Button>
        </div>
      </div>

      {/* Sub-sections List */}
      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const isExpanded = expandedIds[idx] ?? false;
          const isItemEditing = isEditing || editingItemIdx === idx;
          const degreeTitle = item.degree || item.field || 'Degree / Certificate';
          const schoolName = item.school || 'University / Institution';
          const dates = (item.start_date || item.started_on || item.end_date || item.ended_on)
            ? `${item.start_date || item.started_on || ''} ${item.end_date || item.ended_on ? `– ${item.end_date || item.ended_on}` : ''}`
            : '';

          return (
            <div
              key={idx}
              className={cn(
                'rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm',
                isExpanded
                  ? 'bg-slate-900/90 border-blue-500/30'
                  : 'bg-slate-950/60 border-border/40 hover:border-border/70'
              )}
            >
              {/* Unwrappable Degree Header */}
              <div
                onClick={() => toggleUnwrap(idx)}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                      {degreeTitle}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                      <span className="truncate text-blue-300 font-medium">{schoolName}</span>
                      {dates && (
                        <>
                          <span className="text-border">•</span>
                          <span className="font-mono text-[10px]">{dates}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      if (!isExpanded) toggleUnwrap(idx);
                      setEditingItemIdx(editingItemIdx === idx ? null : idx);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                    title={isItemEditing ? 'Done Editing' : 'Edit Entry'}
                  >
                    {isItemEditing ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Edit2 className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={(e) => handleRemove(idx, e)}
                    className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => toggleUnwrap(idx)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                    aria-label={isExpanded ? 'Collapse' : 'Unwrap'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-blue-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Unwrapped Education Details */}
              {isExpanded && (
                <div className="p-4 border-t border-border/30 bg-slate-950/40 animate-fade-in space-y-3">
                  {isItemEditing ? (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Degree Name / Qualification
                          </label>
                          <Input
                            value={item.degree || ''}
                            onChange={(e) => handleUpdate(idx, { ...item, degree: e.target.value })}
                            placeholder="e.g. B.S. in Computer Science"
                            className="font-bold text-xs bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            University / School Name
                          </label>
                          <Input
                            value={item.school || ''}
                            onChange={(e) => handleUpdate(idx, { ...item, school: e.target.value })}
                            placeholder="e.g. Stanford University"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Start Date – End Date
                          </label>
                          <Input
                            value={dates}
                            onChange={(e) => handleUpdate(idx, { ...item, start_date: e.target.value, end_date: '' })}
                            placeholder="e.g. 2020 – 2024"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Field of Study / Specialization
                          </label>
                          <Input
                            value={item.field || item.notes || ''}
                            onChange={(e) => handleUpdate(idx, { ...item, field: e.target.value, notes: e.target.value })}
                            placeholder="e.g. Distributed AI Systems"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{schoolName}</span>
                      </div>
                      {(item.field || item.notes) && (
                        <p className="text-xs text-foreground/85 leading-relaxed pt-1">
                          {item.field || item.notes}
                        </p>
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
