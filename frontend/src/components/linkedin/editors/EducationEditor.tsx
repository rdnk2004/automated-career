import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Plus, Trash2, Calendar, Building2 } from 'lucide-react';

interface EducationItem {
  degree?: string;
  school?: string;
  started_on?: string;
  ended_on?: string;
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

  const handleUpdate = (idx: number, updated: EducationItem) => {
    const next = [...items];
    next[idx] = updated;
    onChange({ ...content, education: next });
  };

  const handleAdd = () => {
    const newItem: EducationItem = {
      degree: 'B.S. in Computer Science',
      school: 'University',
      started_on: '2018',
      ended_on: '2022',
      notes: 'Focus on Distributed Systems and Machine Learning',
    };
    onChange({ ...content, education: [newItem, ...items] });
  };

  const handleRemove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    onChange({ ...content, education: next });
  };

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
            Add Education
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <div className="p-6 text-center text-muted-foreground bg-slate-950/40 rounded-2xl border border-dashed text-xs">
          No education entries found. Click Edit to add your academic degrees or certifications.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/70 border border-border/40 space-y-3 shadow-md"
          >
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 font-mono">
                    Entry #{idx + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleRemove(idx)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-6 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                      Degree / Certificate
                    </label>
                    <Input
                      value={item.degree || ''}
                      onChange={(e) => handleUpdate(idx, { ...item, degree: e.target.value })}
                      placeholder="e.g. B.S. in Computer Science"
                      className="h-8 text-xs bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                      Institution / School
                    </label>
                    <Input
                      value={item.school || ''}
                      onChange={(e) => handleUpdate(idx, { ...item, school: e.target.value })}
                      placeholder="e.g. Stanford University"
                      className="h-8 text-xs bg-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                      Dates
                    </label>
                    <Input
                      value={item.ended_on ? `${item.started_on || ''} - ${item.ended_on}` : item.started_on || ''}
                      onChange={(e) => handleUpdate(idx, { ...item, ended_on: e.target.value })}
                      placeholder="e.g. 2018 - 2022"
                      className="h-8 text-xs bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                      Honors / Specialization
                    </label>
                    <Input
                      value={item.notes || ''}
                      onChange={(e) => handleUpdate(idx, { ...item, notes: e.target.value })}
                      placeholder="e.g. Magna Cum Laude • AI Honors"
                      className="h-8 text-xs bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-indigo-400" />
                      {item.degree || 'Degree'}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                      <Building2 className="h-3 w-3 text-muted-foreground/70" />
                      {item.school || 'Institution'}
                    </p>
                  </div>

                  {(item.started_on || item.ended_on) && (
                    <Badge variant="outline" className="text-[10px] font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.started_on} {item.ended_on ? `— ${item.ended_on}` : ''}
                    </Badge>
                  )}
                </div>

                {item.notes && (
                  <p className="text-xs text-foreground/80 pt-1 leading-relaxed">
                    {item.notes}
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
