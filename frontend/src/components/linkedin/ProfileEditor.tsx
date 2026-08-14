import { useState } from 'react';
import { useProfile, useUpdateSection } from '@/hooks/useProfile';
import { SectionScore } from './SectionScore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Briefcase, GraduationCap, Award, Code, Edit3, Save, X, FileText } from 'lucide-react';

export function ProfileEditor() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateSection, isPending } = useUpdateSection();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium">Loading LinkedIn Profile...</p>
      </div>
    );
  }

  if (!profile || !profile.sections || profile.sections.length === 0) {
    return (
      <div className="p-8 glass-card rounded-2xl border border-dashed text-center text-muted-foreground space-y-3">
        <FileText className="h-10 w-10 text-indigo-400 mx-auto opacity-60" />
        <h4 className="font-semibold text-foreground text-base">No LinkedIn Profile Imported</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Upload your LinkedIn Data Export ZIP file using the panel on the right to import and score your sections.
        </p>
      </div>
    );
  }

  const getSectionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'headline':
      case 'about': return User;
      case 'experience': return Briefcase;
      case 'education': return GraduationCap;
      case 'skills': return Code;
      default: return Award;
    }
  };

  const handleEdit = (sec: any) => {
    setEditingId(sec.id);
    setEditContent(JSON.stringify(sec.content, null, 2));
  };

  const handleSave = (sec: any) => {
    try {
      const parsed = JSON.parse(editContent);
      updateSection({ section_type: sec.section_type, title: sec.title, content: parsed });
      setEditingId(null);
    } catch (e) {
      alert('Invalid JSON content format.');
    }
  };

  return (
    <div className="space-y-4">
      {profile.sections.map((sec) => {
        const Icon = getSectionIcon(sec.section_type);
        const isEditing = editingId === sec.id;

        return (
          <Card key={sec.id} className="glass-card border-border/40 overflow-hidden shadow-lg transition-all duration-200 hover:border-indigo-500/30">
            <div className="p-4 border-b border-border/30 bg-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm capitalize text-foreground flex items-center gap-2">
                    {sec.title || sec.section_type}
                    <SectionScore score={sec.ai_score} />
                  </h3>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                    {sec.section_type}
                  </span>
                </div>
              </div>

              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => handleEdit(sec)} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-8 text-xs gap-1">
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button size="sm" disabled={isPending} onClick={() => handleSave(sec)} className="h-8 text-xs gap-1 bg-indigo-600 hover:bg-indigo-500 text-white">
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4">
              {isEditing ? (
                <textarea
                  className="w-full h-40 p-3 rounded-xl border border-indigo-500/40 bg-slate-950/80 font-mono text-xs text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none shadow-inner"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              ) : (
                <pre className="text-xs text-muted-foreground font-mono bg-slate-950/50 p-3 rounded-xl border border-border/30 overflow-x-auto whitespace-pre-wrap max-h-48">
                  {JSON.stringify(sec.content, null, 2)}
                </pre>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
