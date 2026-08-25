import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Sparkles, Tag } from 'lucide-react';

export function SkillsEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const [newSkill, setNewSkill] = useState('');

  const getSkills = (): string[] => {
    if (Array.isArray(content)) return content.map((s) => (typeof s === 'string' ? s : s.name || ''));
    if (content?.skills && Array.isArray(content.skills)) {
      return content.skills.map((s: any) => (typeof s === 'string' ? s : s.name || ''));
    }
    return [];
  };

  const skills = getSkills().filter(Boolean);

  const handleAddSkill = (skillToAdd?: string) => {
    const term = (skillToAdd || newSkill).trim();
    if (!term || skills.includes(term)) return;

    const nextSkills = [...skills, term];
    if (Array.isArray(content)) {
      onChange(nextSkills);
    } else {
      onChange({ ...content, skills: nextSkills });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const nextSkills = skills.filter((s) => s !== skillToRemove);
    if (Array.isArray(content)) {
      onChange(nextSkills);
    } else {
      onChange({ ...content, skills: nextSkills });
    }
  };

  const quickRecommendations = [
    'FastAPI',
    'PostgreSQL',
    'Docker',
    'LangChain',
    'Kubernetes',
    'TypeScript',
    'PyTorch',
    'Zustand',
  ].filter((s) => !skills.includes(s));

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="Type skill & press Enter (e.g. PyTorch, Distributed Systems)..."
              className="h-9 text-xs bg-slate-950/80"
              icon={<Tag className="h-3.5 w-3.5" />}
            />
            <Button
              size="sm"
              onClick={() => handleAddSkill()}
              disabled={!newSkill.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-9 text-xs gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {quickRecommendations.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1 mr-1">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Quick Suggestions:
              </span>
              {quickRecommendations.slice(0, 5).map((rec) => (
                <button
                  key={rec}
                  onClick={() => handleAddSkill(rec)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/25 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-2.5 w-2.5" />
                  {rec}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skills Chip Cloud */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-border/40 min-h-[90px] flex flex-wrap gap-2 items-center">
        {skills.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">
            No skills listed yet. Click Edit to add your technical skills.
          </span>
        ) : (
          skills.map((skill, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-200 border-indigo-500/30 hover:border-indigo-500/50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>{skill}</span>
              {isEditing && (
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-muted-foreground hover:text-rose-400 rounded-full p-0.5"
                  title={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>Total Verified Skills: <strong className="text-foreground">{skills.length}</strong></span>
        <span className="font-mono text-[10px]">Optimal target: 25–40 core skills</span>
      </div>
    </div>
  );
}
