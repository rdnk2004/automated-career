import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award,
  Plus,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Edit2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CertificationItem {
  id?: string;
  name?: string;
  title?: string;
  authority?: string;
  issuer?: string;
  url?: string;
  date?: string;
  started_on?: string;
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
  // Extract list of certifications
  const getCertifications = (): CertificationItem[] => {
    if (Array.isArray(content)) return content;
    if (content?.certifications && Array.isArray(content.certifications)) return content.certifications;
    if (content?.name || content?.authority || content?.title) return [content];
    return [];
  };

  const certs = getCertifications();
  // State for which sub-items are unwrapped/expanded
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({ 0: true });
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const toggleUnwrap = (idx: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleUpdate = (idx: number, updated: CertificationItem) => {
    const next = [...certs];
    next[idx] = updated;
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, certifications: next });
  };

  const handleAdd = () => {
    const newCert: CertificationItem = {
      name: 'New Certification Title',
      authority: 'Issuing Organization',
      date: '2025',
      url: '',
    };
    const next = [newCert, ...certs];
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, certifications: next });
    setExpandedIds((prev) => ({ ...prev, 0: true }));
    setEditingItemIdx(0);
  };

  const handleRemove = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = certs.filter((_, i) => i !== idx);
    if (Array.isArray(content)) onChange(next);
    else onChange({ ...content, certifications: next });
    if (editingItemIdx === idx) setEditingItemIdx(null);
  };

  if (certs.length === 0 && !isEditing) {
    return (
      <div className="p-6 rounded-2xl bg-slate-950/40 border border-border/40 text-center text-xs text-muted-foreground italic">
        No certifications listed.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sub-toolbar: Add button and collapse/expand all */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-muted-foreground">
          {certs.length} {certs.length === 1 ? 'Credential' : 'Credentials'} Verified
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const allOpen = certs.every((_, i) => expandedIds[i]);
              const nextState: Record<number, boolean> = {};
              certs.forEach((_, i) => {
                nextState[i] = !allOpen;
              });
              setExpandedIds(nextState);
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium px-2 py-0.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {certs.every((_, i) => expandedIds[i]) ? 'Collapse All' : 'Unwrap All'}
          </button>

          <Button
            size="xs"
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs gap-1 h-7"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Certification
          </Button>
        </div>
      </div>

      {/* Sub-sections List: Each certification is an unwrappable item */}
      <div className="space-y-2.5">
        {certs.map((cert, idx) => {
          const isExpanded = expandedIds[idx] ?? false;
          const isItemEditing = isEditing || editingItemIdx === idx;
          const certName = cert.name || cert.title || 'Untitled Certification';
          const certAuthority = cert.authority || cert.issuer || 'Issuing Authority';
          const certDate = cert.date || cert.started_on || '';

          return (
            <div
              key={idx}
              className={cn(
                'rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm',
                isExpanded
                  ? 'bg-slate-900/90 border-indigo-500/30'
                  : 'bg-slate-950/60 border-border/40 hover:border-border/70'
              )}
            >
              {/* Unwrappable Sub-section Header */}
              <div
                onClick={() => toggleUnwrap(idx)}
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                      {certName}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                      <span className="truncate text-indigo-300 font-medium">{certAuthority}</span>
                      {certDate && (
                        <>
                          <span className="text-border">•</span>
                          <span className="font-mono text-[10px]">{certDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Action Badges & Chevron */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {cert.url && !isItemEditing && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg flex items-center gap-1 transition-colors mr-1"
                      title="View Credential Link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => {
                      if (!isExpanded) toggleUnwrap(idx);
                      setEditingItemIdx(editingItemIdx === idx ? null : idx);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                    title={isItemEditing ? 'Done Editing' : 'Edit Certification'}
                  >
                    {isItemEditing ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Edit2 className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={(e) => handleRemove(idx, e)}
                    className="p-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Certification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => toggleUnwrap(idx)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                    aria-label={isExpanded ? 'Collapse' : 'Unwrap'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Unwrapped Sub-section Body */}
              {isExpanded && (
                <div className="p-4 border-t border-border/30 bg-slate-950/40 animate-fade-in space-y-3">
                  {isItemEditing ? (
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Certification Title
                        </label>
                        <Input
                          value={cert.name || cert.title || ''}
                          onChange={(e) => handleUpdate(idx, { ...cert, name: e.target.value, title: e.target.value })}
                          placeholder="e.g. Oracle Cloud Infrastructure 2025 Certified Data Science Professional"
                          className="font-bold text-xs bg-slate-900"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Issuing Organization
                          </label>
                          <Input
                            value={cert.authority || cert.issuer || ''}
                            onChange={(e) => handleUpdate(idx, { ...cert, authority: e.target.value, issuer: e.target.value })}
                            placeholder="e.g. Oracle / AWS / Coursera"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Issue Date
                          </label>
                          <Input
                            value={cert.date || cert.started_on || ''}
                            onChange={(e) => handleUpdate(idx, { ...cert, date: e.target.value, started_on: e.target.value })}
                            placeholder="e.g. Jan 2025"
                            className="text-xs bg-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Credential URL / Verification Link
                        </label>
                        <Input
                          value={cert.url || ''}
                          onChange={(e) => handleUpdate(idx, { ...cert, url: e.target.value })}
                          placeholder="https://..."
                          className="text-xs bg-slate-900"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-foreground font-medium">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          Issuer: <strong className="text-indigo-300">{certAuthority}</strong>
                        </span>
                        {certDate && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="h-3 w-3" />
                            Issued: {certDate}
                          </span>
                        )}
                      </div>

                      {cert.url ? (
                        <div className="pt-1">
                          <a
                            href={cert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Verified Credential Certificate
                          </a>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic pt-1">
                          No public verification URL attached.
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
