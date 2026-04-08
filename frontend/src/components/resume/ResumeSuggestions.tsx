import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useResumeSuggestion } from '@/hooks/useJobSearch';
import { useJobStore } from '@/stores/jobStore';
import ReactDiffViewer from 'react-diff-viewer-continued';

export function ResumeSuggestions() {
  const { activeTitle } = useJobStore();
  const [resumeText, setResumeText] = useState('');
  const { mutate: analyzeResume, data: suggestions, isPending } = useResumeSuggestion();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleAnalyze = () => {
    if (resumeText.trim()) {
      analyzeResume({ resumeText, targetRole: activeTitle });
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card className="flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Analyze Resume</span>
            {suggestions && (
              <Badge variant={suggestions.match_score > 75 ? "default" : "destructive"}>
                Match Score: {suggestions.match_score}/100
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full h-32 p-3 text-sm border rounded-md bg-transparent placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Paste your current resume text here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
          <div className="flex justify-end mt-4">
            <Button onClick={handleAnalyze} disabled={isPending || !resumeText.trim()}>
              {isPending ? 'Analyzing...' : 'Generate Suggestions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestions && (
        <Card className="flex-1 overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-lg">AI Bullet Rewrites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {suggestions.bullet_rewrites.map((rewrite, idx) => (
              <div key={idx} className="border rounded-md overflow-hidden relative">
                <div className="bg-muted px-3 py-2 text-xs font-semibold flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground">Evidence:</span>
                    {rewrite.evidence_refs?.map(ref => (
                      <Badge key={ref} variant="secondary" className="text-[10px] py-0">{ref}</Badge>
                    ))}
                    {(!rewrite.evidence_refs || rewrite.evidence_refs.length === 0) && (
                      <span className="font-normal italic text-muted-foreground">General best practice</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 text-xs px-2" 
                    onClick={() => copyToClipboard(rewrite.suggested, idx)}
                  >
                    {copiedIdx === idx ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                {rewrite.original ? (
                  <ReactDiffViewer 
                    oldValue={rewrite.original} 
                    newValue={rewrite.suggested} 
                    splitView={false} 
                    hideLineNumbers 
                    styles={{
                      variables: { light: { diffViewerBackground: 'transparent', addedBackground: 'rgba(34, 197, 94, 0.1)', removedBackground: 'rgba(239, 68, 68, 0.1)' } }
                    }}
                  />
                ) : (
                  <div className="p-3 text-sm bg-green-500/10 text-green-700 dark:text-green-400">
                    <span className="font-bold mr-2">+</span>
                    {rewrite.suggested}
                  </div>
                )}
              </div>
            ))}
            
            {suggestions.bullet_rewrites.length === 0 && (
              <p className="text-sm text-muted-foreground">No specific bullet point rewrites suggested.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
