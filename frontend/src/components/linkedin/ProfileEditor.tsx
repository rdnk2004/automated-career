import { useState } from 'react';
import { useProfile, useUpdateSection } from '@/hooks/useProfile';
import { SectionScore } from './SectionScore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ProfileEditor() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateSection, isPending } = useUpdateSection();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  if (isLoading) return <div>Loading profile...</div>;
  if (!profile || !profile.sections || profile.sections.length === 0) {
    return <div className="p-4 border rounded-md text-muted-foreground">No profile data. Please import your LinkedIn ZIP.</div>;
  }

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
      alert('Invalid JSON content');
    }
  };

  return (
    <div className="space-y-4">
      {profile.sections.map((sec) => (
        <Card key={sec.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg flex items-center">
              {sec.title || sec.section_type}
              <SectionScore score={sec.ai_score} />
            </h3>
            {editingId !== sec.id ? (
              <Button variant="outline" size="sm" onClick={() => handleEdit(sec)}>Edit</Button>
            ) : (
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                <Button size="sm" disabled={isPending} onClick={() => handleSave(sec)}>Save</Button>
              </div>
            )}
          </div>
          
          {editingId === sec.id ? (
            <textarea 
              className="w-full h-32 p-2 border rounded-md font-mono text-sm bg-transparent" 
              value={editContent} 
              onChange={(e) => setEditContent(e.target.value)} 
            />
          ) : (
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap overflow-hidden">
              {JSON.stringify(sec.content, null, 2)}
            </pre>
          )}
        </Card>
      ))}
    </div>
  );
}
