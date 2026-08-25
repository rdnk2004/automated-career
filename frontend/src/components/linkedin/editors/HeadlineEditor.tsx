import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MapPin, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeadlineContent {
  headline?: string;
  subhead?: string;
  location?: string;
  [key: string]: any;
}

export function HeadlineEditor({
  content,
  onChange,
  isEditing,
}: {
  content: HeadlineContent;
  onChange: (updated: HeadlineContent) => void;
  isEditing: boolean;
}) {
  const headlineText = typeof content === 'string' ? content : content?.headline || '';
  const locationText = content?.location || 'San Francisco, CA (Open to Remote)';
  const charLimit = 220;
  const charsLeft = charLimit - headlineText.length;

  const handleChangeHeadline = (val: string) => {
    if (typeof content === 'string') {
      onChange({ headline: val });
    } else {
      onChange({ ...content, headline: val });
    }
  };

  const handleChangeLocation = (val: string) => {
    onChange({ ...content, location: val });
  };

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Headline Text
              </label>
              <span
                className={cn(
                  'text-[10px] font-mono font-medium',
                  charsLeft < 0
                    ? 'text-rose-400 font-bold'
                    : charsLeft < 30
                    ? 'text-amber-400'
                    : 'text-muted-foreground'
                )}
              >
                {headlineText.length} / {charLimit} chars
              </span>
            </div>
            <textarea
              value={headlineText}
              onChange={(e) => handleChangeHeadline(e.target.value)}
              placeholder="e.g. Senior AI Systems Engineer | LLM Architecture, FastAPI, Distributed Systems | ex-Google"
              className="w-full h-24 p-3 rounded-xl border border-indigo-500/40 bg-slate-950/80 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Location & Availability
            </label>
            <Input
              value={locationText}
              onChange={(e) => handleChangeLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA • Open to Remote"
              className="bg-slate-950/80 border-border/50 text-xs"
            />
          </div>
        </div>
      ) : null}

      {/* Live LinkedIn Card Mockup Preview */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-950/90 border border-border/40 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-border/30 pb-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            <Linkedin className="h-3 w-3 text-blue-400" />
            Live LinkedIn Header Preview
          </div>
          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/20">
            Public Card
          </Badge>
        </div>

        <div className="flex items-start gap-3.5 pt-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center font-bold text-sm text-white shadow-md ring-2 ring-blue-500/30 shrink-0 font-heading">
            RD
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              RDNK
              <Sparkles className="h-3 w-3 text-amber-400" />
            </h4>
            <p className="text-xs text-foreground/90 font-medium leading-snug break-words">
              {headlineText || 'No headline set yet.'}
            </p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
              <MapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
              <span>{locationText}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
