import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeartHandshake, Plus, Trash2, Calendar } from 'lucide-react';

interface VolunteerWork {
  role?: string;
  organization?: string;
  cause?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export function VolunteerEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const getVolunteer = (): VolunteerWork[] => {
    if (Array.isArray(content)) return content;
    if (content?.volunteer && Array.isArray(content.volunteer)) return content.volunteer;
    if (content?.role || content?.organization) return [content];
    return [];
  };

  const items = getVolunteer();

  const handleUpdate = (idx: number, updated: VolunteerWork) => {
    const next = [...items];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, volunteer: next });
  };

  const handleAdd = () => {
    const newItem: VolunteerWork = {
      role: 'Volunteer Engineer / Mentor',
      organization: 'Tech Community / Non-Profit',
      cause: 'Education & Technology',
      description: 'Mentoring aspiring developers and contributing to open community projects.',
      start_date: '2023',
      end_date: 'Present',
    };
    if (Array.isArray(content)) onChange([newItem, ...items]);
    else onChange({ ...content, volunteer: [newItem, ...items] });
  };

  const handleRemove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, volunteer: next });
  };

  if (items.length === 0 && !isEditing) {
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
            Add Volunteer Experience
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/60 border border-border/40 space-y-2.5 hover:border-border/70 transition-all shadow-sm"
          >
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={item.role || ''}
                    onChange={(e) => handleUpdate(idx, { ...item, role: e.target.value })}
                    placeholder="Role (e.g. Volunteer Mentor)"
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
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={item.organization || ''}
                    onChange={(e) => handleUpdate(idx, { ...item, organization: e.target.value })}
                    placeholder="Organization Name"
                    className="text-xs bg-slate-900"
                  />
                  <Input
                    value={item.cause || ''}
                    onChange={(e) => handleUpdate(idx, { ...item, cause: e.target.value })}
                    placeholder="Cause (e.g. Education)"
                    className="text-xs bg-slate-900"
                  />
                </div>
                <textarea
                  rows={2}
                  value={item.description || ''}
                  onChange={(e) => handleUpdate(idx, { ...item, description: e.target.value })}
                  placeholder="Summary of volunteer work..."
                  className="w-full p-2.5 text-xs font-sans rounded-xl border border-border/40 bg-slate-900 text-foreground resize-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                      <HeartHandshake className="h-3.5 w-3.5 text-rose-400" />
                      {item.role || 'Volunteer'}
                    </h5>
                    <p className="text-xs text-indigo-300 font-medium">
                      {item.organization || 'Organization'}
                      {item.cause ? ` • ${item.cause}` : ''}
                    </p>
                  </div>
                  {(item.start_date || item.end_date) && (
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.start_date || ''} {item.end_date ? `– ${item.end_date}` : ''}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {item.description}
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
