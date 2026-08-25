import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Sparkles, Copy, Check } from 'lucide-react';

export function RawJsonEditor({
  content,
  onChange,
  isEditing,
}: {
  content: any;
  onChange: (updated: any) => void;
  isEditing: boolean;
}) {
  const [text, setText] = useState(() => JSON.stringify(content, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setText(JSON.stringify(content, null, 2));
    setError(null);
  }, [content]);

  const handleTextChange = (newVal: string) => {
    setText(newVal);
    try {
      const parsed = JSON.parse(newVal);
      setError(null);
      onChange(parsed);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON syntax');
    }
  };

  const handleBeautify = () => {
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      setText(formatted);
      setError(null);
    } catch (e: any) {
      setError('Cannot format invalid JSON');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={error ? 'destructive' : 'success'}
            className="text-[10px] font-mono px-2 py-0.5"
          >
            {error ? (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Syntax Error
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Valid JSON
              </span>
            )}
          </Badge>
          {error && <span className="text-[11px] text-rose-400 truncate max-w-xs">{error}</span>}
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleBeautify}
              className="text-[10px] h-6 px-2 gap-1 border-indigo-500/30 text-indigo-300"
            >
              <Sparkles className="h-2.5 w-2.5" />
              Beautify
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={handleCopy}
            className="text-[10px] h-6 px-2 text-muted-foreground hover:text-foreground gap-1"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => isEditing && handleTextChange(e.target.value)}
        readOnly={!isEditing}
        className="w-full h-48 p-3.5 rounded-xl border border-indigo-500/30 bg-slate-950/90 font-mono text-[11px] text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed shadow-inner"
        spellCheck={false}
      />
    </div>
  );
}
