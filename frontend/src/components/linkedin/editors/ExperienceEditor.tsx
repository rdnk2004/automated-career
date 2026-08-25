import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Plus,
  Trash2,
  Calendar,
  Building2,
  MapPin,
  ListPlus,
  X,
} from 'lucide-react';

interface Position {
  title: string;
  company: string;
  location?: string;
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
  // Normalize content into an array of positions
  const getPositions = (): Position[] => {
    if (Array.isArray(content)) return content;
    if (content?.positions && Array.isArray(content.positions)) return content.positions;
    if (content?.title || content?.company) return [content];
    return [];
  };

  const positions = getPositions();

  const handleUpdatePosition = (idx: number, updated: Position) => {
    const next = [...positions];
    next[idx] = updated;
    onChange({ ...content, positions: next });
  };

  const handleAddPosition = () => {
    const newPos: Position = {
      title: 'Senior Engineer',
      company: 'Tech Company',
      location: 'Remote',
      started_on: '2023',
      ended_on: 'Present',
      description: '',
      bullets: ['Spearheaded development of high-throughput AI services, increasing pipeline speed by 40%.'],
    };
    onChange({ ...content, positions: [newPos, ...positions] });
  };

  const handleRemovePosition = (idx: number) => {
    const next = positions.filter((_, i) => i !== idx);
    onChange({ ...content, positions: next });
  };

  const handleAddBullet = (posIdx: number) => {
    const pos = positions[posIdx];
    const currentBullets = pos.bullets || (pos.description ? [pos.description] : []);
    const updatedBullets = [...currentBullets, 'Architected scalable cloud backend and automated CI/CD deployment pipelines.'];
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

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAddPosition}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Position
          </Button>
        </div>
      )}

      {positions.length === 0 && (
        <div className="p-6 text-center text-muted-foreground bg-slate-950/40 rounded-2xl border border-dashed text-xs">
          No structured positions found in this section. Click Edit to add your career experience.
        </div>
      )}

      <div className="space-y-4">
        {positions.map((pos, pIdx) => {
          const bullets = pos.bullets || (pos.description ? [pos.description] : []);

          return (
            <div
              key={pIdx}
              className="p-4 rounded-2xl bg-slate-950/70 border border-border/40 space-y-3.5 shadow-md transition-all hover:border-indigo-500/30"
            >
              {isEditing ? (
                /* Editable Position Card */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase font-mono">
                      Role #{pIdx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleRemovePosition(pIdx)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-6 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                        Job Title
                      </label>
                      <Input
                        value={pos.title || ''}
                        onChange={(e) => handleUpdatePosition(pIdx, { ...pos, title: e.target.value })}
                        placeholder="e.g. Lead AI Systems Engineer"
                        className="h-8 text-xs bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                        Company Name
                      </label>
                      <Input
                        value={pos.company || ''}
                        onChange={(e) => handleUpdatePosition(pIdx, { ...pos, company: e.target.value })}
                        placeholder="e.g. Acme Corp"
                        className="h-8 text-xs bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                        Start Date
                      </label>
                      <Input
                        value={pos.started_on || ''}
                        onChange={(e) => handleUpdatePosition(pIdx, { ...pos, started_on: e.target.value })}
                        placeholder="e.g. Jan 2022"
                        className="h-8 text-xs bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                        End Date
                      </label>
                      <Input
                        value={pos.ended_on || ''}
                        onChange={(e) => handleUpdatePosition(pIdx, { ...pos, ended_on: e.target.value })}
                        placeholder="e.g. Present"
                        className="h-8 text-xs bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                        Location
                      </label>
                      <Input
                        value={pos.location || ''}
                        onChange={(e) => handleUpdatePosition(pIdx, { ...pos, location: e.target.value })}
                        placeholder="e.g. San Francisco, CA"
                        className="h-8 text-xs bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Bullet Points Management */}
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground">
                        Achievement Bullet Points ({bullets.length})
                      </span>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleAddBullet(pIdx)}
                        className="h-6 text-[10px] gap-1 border-indigo-500/30 text-indigo-300"
                      >
                        <ListPlus className="h-3 w-3" />
                        Add Bullet
                      </Button>
                    </div>

                    {bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2">
                        <span className="text-indigo-400 text-xs mt-2">•</span>
                        <textarea
                          value={bullet}
                          onChange={(e) => handleUpdateBullet(pIdx, bIdx, e.target.value)}
                          className="flex-1 p-2 rounded-lg border border-border/40 bg-slate-900 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-16"
                        />
                        <button
                          onClick={() => handleRemoveBullet(pIdx, bIdx)}
                          className="text-muted-foreground hover:text-rose-400 p-1 mt-1 rounded-md"
                          title="Remove bullet"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Read-Only Position View */
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/30 pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-indigo-400" />
                        {pos.title || 'Role'}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground/80 flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground/70" />
                          {pos.company || 'Company'}
                        </span>
                        {pos.location && (
                          <span className="flex items-center gap-1">
                            • <MapPin className="h-3 w-3 text-muted-foreground/70" />
                            {pos.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {(pos.started_on || pos.ended_on) && (
                      <Badge variant="outline" className="text-[10px] font-mono flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {pos.started_on || 'Start'} — {pos.ended_on || 'Present'}
                      </Badge>
                    )}
                  </div>

                  {/* Bullet points rendering */}
                  <ul className="space-y-1.5 text-xs text-foreground/90 pl-1">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
