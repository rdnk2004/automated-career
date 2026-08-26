import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Plus, Trash2, Calendar } from 'lucide-react';

interface AwardItem {
  title?: string;
  issuer?: string;
  description?: string;
  date?: string;
}

export function AwardsEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const getAwards = (): AwardItem[] => {
    if (Array.isArray(content)) return content;
    if (content?.awards && Array.isArray(content.awards)) return content.awards;
    if (content?.honors && Array.isArray(content.honors)) return content.honors;
    if (content?.title || content?.issuer) return [content];
    return [];
  };

  const items = getAwards();

  const handleUpdate = (idx: number, updated: AwardItem) => {
    const next = [...items];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, awards: next });
  };

  const handleAdd = () => {
    const newItem: AwardItem = {
      title: 'Hackathon Winner / Academic Honor',
      issuer: 'Organization / University',
      description: 'Awarded 1st place for architecting multi-agent AI system.',
      date: '2024',
    };
    if (Array.isArray(content)) onChange([newItem, ...items]);
    else onChange({ ...content, awards: [newItem, ...items] });
  };

  const handleRemove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, awards: next });
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
            Add Award / Honor
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
                    value={item.title || ''}
                    onChange={(e) => handleUpdate(idx, { ...item, title: e.target.value })}
                    placeholder="Award Title"
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
                    value={item.issuer || ''}
                    onChange={(e) => handleUpdate(idx, { ...item, issuer: e.target.value })}
                    placeholder="Issuer / Authority"
                    className="text-xs bg-slate-900"
                  />
                  <Input
                    value={item.date || ''}
                    onChange={(e) => handleUpdate(idx, { ...item, date: e.target.value })}
                    placeholder="Date Issued (e.g. 2024)"
                    className="text-xs bg-slate-900"
                  />
                </div>
                <textarea
                  rows={2}
                  value={item.description || ''}
                  onChange={(e) => handleUpdate(idx, { ...item, description: e.target.value })}
                  placeholder="Details regarding the award or honor..."
                  className="w-full p-2.5 text-xs font-sans rounded-xl border border-border/40 bg-slate-900 text-foreground resize-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      {item.title || 'Honor / Award'}
                    </h5>
                    <p className="text-xs text-indigo-300 font-medium">
                      {item.issuer || 'Issuer'}
                    </p>
                  </div>
                  {item.date && (
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.date}
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
