import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Sparkles } from 'lucide-react';

interface AboutContent {
  summary?: string;
  [key: string]: any;
}

export function AboutEditor({
  content,
  onChange,
  isEditing,
}: {
  content: AboutContent;
  onChange: (updated: AboutContent) => void;
  isEditing: boolean;
}) {
  const summaryText = typeof content === 'string' ? content : content?.summary || '';
  const wordCount = summaryText.trim() ? summaryText.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleChange = (val: string) => {
    if (typeof content === 'string') {
      onChange({ summary: val });
    } else {
      onChange({ ...content, summary: val });
    }
  };

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              About / Executive Bio
            </label>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
              <span>{wordCount} words</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> ~{readTimeMin} min read
              </span>
            </div>
          </div>
          <textarea
            value={summaryText}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your professional narrative, technical specializations, high-impact achievements, and target focus..."
            className="w-full h-44 p-3.5 rounded-xl border border-indigo-500/40 bg-slate-950/80 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y font-sans leading-relaxed shadow-inner"
          />
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-border/40 text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans shadow-inner">
          {summaryText ? (
            summaryText
          ) : (
            <span className="text-muted-foreground italic">No About section bio provided. Click Edit to add one.</span>
          )}
        </div>
      )}

      {/* Narrative Telemetry Pill */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 pt-1 border-t border-border/30">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Optimal bio length: 150–300 words with quantified engineering impact
        </span>
        <Badge variant="outline" className="text-[10px] font-mono">
          {wordCount} Words
        </Badge>
      </div>
    </div>
  );
}
