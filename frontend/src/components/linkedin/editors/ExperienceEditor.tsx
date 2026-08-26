import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Plus,
  Trash2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PositionItem {
  id?: string;
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  started_on?: string;
  ended_on?: string;
  description?: string;
  bullets?: string[];
}

export function ExperienceEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const getPositions = (): PositionItem[] => {
    if (Array.isArray(content)) return content;
    if (content?.positions && Array.isArray(content.positions)) return content.positions;
    if (content?.title || content?.company) return [content];
    return [];
  };

  const positions = getPositions();
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({ 0: true });
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const toggleUnwrap = (idx: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleUpdatePosition = (idx: number, updated: PositionItem) => {
    const next = [...positions];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, positions: next });
  };

  const handleAddPosition = () => {
    const newPos: PositionItem = {
      title: 'Senior Engineer',
      company: 'Tech Company',
      location: 'Remote',
      start_date: '2023',
      end_date: 'Present',
      description: 'Architected distributed backend pipelines and AI orchestration layers.',
      bullets: ['Spearheaded development of high-throughput AI services, reducing latency by 40%.'],
    };
    const next = [newPos, ...positions];
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, positions: next });
    setExpandedIds((prev) => ({ ...prev, 0: true }));
    setEditingItemIdx(0);
  };

  const handleRemovePosition = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = positions.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, positions: next });
    if (editingItemIdx === idx) setEditingItemIdx(null);
  };

  const handleAddBullet = (posIdx: number) => {
    const pos = positions[posIdx];
    const currentBullets = pos.bullets || (pos.description ? [pos.description] : []);
    const updatedBullets = [...currentBullets, 'Spearheaded technical initiatives improving scalability by 35%.'];
    handleUpdatePosition(posIdx, { ...pos, bullets: updatedBullets });
  };

  const handleUpdateBullet = (posIdx: number, bulletIdx: number, text: string) => {
    const pos = positions[posIdx];
    const currentBullets = [...(pos.bullets || [pos.description || ''])];
    currentBullets[bulletIdx] = text;
    handleUpdatePosition(posIdx, { ...pos, bullets: currentBullets });
  };

  const handleRemoveBullet = (posIdx: number, bulletIdx: number) => {
    const pos = positions[posIdx];
    const currentBullets = (pos.bullets || []).filter((_, i) => i !== bulletIdx);
    handleUpdatePosition(posIdx, { ...pos, bullets: currentBullets });
  };

  if (positions.length === 0 && !isEditing) {
    return (
      <div className="p-6 rounded-2xl bg-slate-950/40 border border-border/40 text-center text-xs text-muted-foreground italic">
        No work experience positions found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-muted-foreground">
          {positions.length} {positions.length === 1 ? 'Role' : 'Roles'} in Career Timeline
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const allOpen = positions.every((_, i) => expandedIds[i]);
              const nextState: Record<number, boolean> = {};
              positions.forEach((_, i) => {
                nextState[i] = !allOpen;
              });
              setExpandedIds(nextState);
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium px-2 py-0.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {positions.every((_, i) => expandedIds[i]) ? 'Collapse All' : 'Unwrap All'}
          </button>

          <Button
            size="xs"
            onClick={handleAddPosition}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs gap-1 h-7"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Position
          </Button>
        </div>
      </div>

      {/* Sub-sections List: Each position is an unwrappable item */}
      <div className="space-y-2.5">
        {positions.map((pos, idx) => {
          const isExpanded = expandedIds[idx] ?? false;
          const isItemEditing = isEditing || editingItemIdx === idx;
          const roleTitle = pos.title || 'Untitled Role';
          const companyName = pos.company || 'Company';
          const dates = (pos.start_date || pos.started_on || pos.end_date || pos.ended_on)
            ? `${pos.start_date || pos.started_on || ''} ${pos.end_date || pos.ended_on ? `– ${pos.end_date || pos.ended_on}` : ''}`
            : '';
          const bullets = pos.bullets || (pos.description ? [pos.description] : []);

          return (
            <div
              key={idx}
              className={cn(
                'rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm',
                isExpanded
                  ? 'bg-slate-900/90 border-emerald-500/30'
                  : 'bg-slate-950/60 border-border/40 hover:border-border/70'
              )}
            >
              {/* Unwrappable Position Header */}
              <div
                onClick={() => toggleUnwrap(idx)}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                      {roleTitle}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                      <span className="truncate text-emerald-300 font-medium">{companyName}</span>
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
                    title={isItemEditing ? 'Done Editing' : 'Edit Position'}
                  >
                    {isItemEditing ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Edit2 className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={(e) => handleRemovePosition(idx, e)}
                    className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Position"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => toggleUnwrap(idx)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                    aria-label={isExpanded ? 'Collapse' : 'Unwrap'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Unwrapped Position Details & Bullets */}
              {isExpanded && (
                <div className="p-4 border-t border-border/30 bg-slate-950/40 animate-fade-in space-y-3">
                  {isItemEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Role / Job Title
                          </label>
                          <Input
                            value={pos.title || ''}
                            onChange={(e) => handleUpdatePosition(idx, { ...pos, title: e.target.value })}
                            placeholder="e.g. Senior Software Engineer"
                            className="font-bold text-xs bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Company Name
                          </label>
                          <Input
                            value={pos.company || ''}
                            onChange={(e) => handleUpdatePosition(idx, { ...pos, company: e.target.value })}
                            placeholder="e.g. Google / Microsoft"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Timeline / Dates
                          </label>
                          <Input
                            value={dates}
                            onChange={(e) => handleUpdatePosition(idx, { ...pos, start_date: e.target.value, end_date: '' })}
                            placeholder="e.g. 2023 – Present"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Location
                          </label>
                          <Input
                            value={pos.location || ''}
                            onChange={(e) => handleUpdatePosition(idx, { ...pos, location: e.target.value })}
                            placeholder="e.g. San Francisco, CA (Hybrid)"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                      </div>

                      {/* Editable Accomplishment Bullets */}
                      <div className="space-y-2 pt-2 border-t border-border/20">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-muted-foreground">
                            Quantified Accomplishment Bullets
                          </label>
                          <button
                            onClick={() => handleAddBullet(idx)}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                          >
                            <Plus className="h-3 w-3" />
                            Add Bullet
                          </button>
                        </div>

                        {bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2">
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => handleUpdateBullet(idx, bIdx, e.target.value)}
                              placeholder="Action Verb + Task + Impact / Metric..."
                              className="w-full p-2 text-xs font-sans rounded-xl border border-border/40 bg-slate-900 text-foreground resize-y leading-relaxed"
                            />
                            <button
                              onClick={() => handleRemoveBullet(idx, bIdx)}
                              className="p-1 text-muted-foreground hover:text-rose-400 mt-1"
                              title="Delete Bullet"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {pos.location && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <MapPin className="h-3 w-3 text-muted-foreground/70" />
                          <span>{pos.location}</span>
                        </div>
                      )}

                      {bullets.length > 0 ? (
                        <ul className="space-y-1.5 pt-1">
                          {bullets.map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2 text-foreground/90 leading-relaxed font-sans">
                              <span className="text-emerald-400 mt-1 shrink-0">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          No bullet points added. Click Edit to add accomplishments.
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
