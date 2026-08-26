import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Award, Plus, Trash2, Calendar, ExternalLink } from 'lucide-react';

interface Certification {
  name?: string;
  authority?: string;
  url?: string;
  date?: string;
}

export function CertificationsEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const getCertifications = (): Certification[] => {
    if (Array.isArray(content)) return content;
    if (content?.certifications && Array.isArray(content.certifications)) return content.certifications;
    if (content?.name || content?.authority) return [content];
    return [];
  };

  const certs = getCertifications();

  const handleUpdate = (idx: number, updated: Certification) => {
    const next = [...certs];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, certifications: next });
  };

  const handleAdd = () => {
    const newCert: Certification = {
      name: 'Professional Cloud / AI Certification',
      authority: 'Google Cloud / AWS / DeepLearning.AI',
      date: '2024',
    };
    if (Array.isArray(content)) onChange([newCert, ...certs]);
    else onChange({ ...content, certifications: [newCert, ...certs] });
  };

  const handleRemove = (idx: number) => {
    const next = certs.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, certifications: next });
  };

  if (certs.length === 0 && !isEditing) {
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
            Add Certification
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {certs.map((cert, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/60 border border-border/40 space-y-2.5 hover:border-border/70 transition-all shadow-sm"
          >
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={cert.name || ''}
                    onChange={(e) => handleUpdate(idx, { ...cert, name: e.target.value })}
                    placeholder="Certification Name"
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
                    value={cert.authority || ''}
                    onChange={(e) => handleUpdate(idx, { ...cert, authority: e.target.value })}
                    placeholder="Issuing Authority (e.g. AWS, Meta)"
                    className="text-xs bg-slate-900"
                  />
                  <Input
                    value={cert.date || ''}
                    onChange={(e) => handleUpdate(idx, { ...cert, date: e.target.value })}
                    placeholder="Issue Date (e.g. 2024)"
                    className="text-xs bg-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h5 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    {cert.name || 'Certification'}
                  </h5>
                  <p className="text-xs text-indigo-300 font-medium">
                    {cert.authority || 'Issuing Authority'}
                  </p>
                  {cert.date && (
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Issued: {cert.date}
                    </span>
                  )}
                </div>
                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Credential
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
