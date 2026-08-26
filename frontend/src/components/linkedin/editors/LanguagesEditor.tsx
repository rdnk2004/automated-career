import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Languages, Plus, Trash2 } from 'lucide-react';

interface LanguageItem {
  name?: string;
  proficiency?: string;
}

export function LanguagesEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const getLanguages = (): LanguageItem[] => {
    if (Array.isArray(content)) return content;
    if (content?.languages && Array.isArray(content.languages)) return content.languages;
    if (content?.name || content?.proficiency) return [content];
    return [];
  };

  const items = getLanguages();

  const handleUpdate = (idx: number, updated: LanguageItem) => {
    const next = [...items];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, languages: next });
  };

  const handleAdd = () => {
    const newItem: LanguageItem = {
      name: 'English',
      proficiency: 'Native or Bilingual',
    };
    if (Array.isArray(content)) onChange([newItem, ...items]);
    else onChange({ ...content, languages: [newItem, ...items] });
  };

  const handleRemove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, languages: next });
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
            Add Language
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-slate-950/60 border border-border/40 space-y-2 flex items-center justify-between shadow-sm"
          >
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={item.name || ''}
                  onChange={(e) => handleUpdate(idx, { ...item, name: e.target.value })}
                  placeholder="Language (e.g. English)"
                  className="text-xs bg-slate-900"
                />
                <Input
                  value={item.proficiency || ''}
                  onChange={(e) => handleUpdate(idx, { ...item, proficiency: e.target.value })}
                  placeholder="Proficiency (e.g. Fluent)"
                  className="text-xs bg-slate-900"
                />
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleRemove(idx)}
                  className="text-rose-400 hover:bg-rose-500/10 h-7 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-foreground">{item.name || 'Language'}</span>
                </div>
                {item.proficiency && (
                  <Badge variant="outline" className="text-[10px] bg-secondary text-muted-foreground font-mono">
                    {item.proficiency}
                  </Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
