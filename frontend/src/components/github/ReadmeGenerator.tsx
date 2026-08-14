import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGenerateReadme, usePushReadme } from '@/hooks/useGithubRepos';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Download, GitPullRequest, FileText, CheckCircle2 } from 'lucide-react';

export function ReadmeGenerator({ repoFullName, hasReadme }: { repoFullName: string, hasReadme: boolean }) {
  const { mutate: generateReadme, isPending: isGenerating } = useGenerateReadme();
  const { mutate: pushReadme, isPending: isPushing } = usePushReadme();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [pushed, setPushed] = useState(false);

  const handleGenerate = () => {
    generateReadme(repoFullName, {
      onSuccess: (data: { readme_markdown: string }) => {
        setMarkdown(data.readme_markdown);
        setPushed(false);
      }
    });
  };

  const handlePush = () => {
    if (markdown) {
      pushReadme({ repoFullName, content: markdown }, {
        onSuccess: () => setPushed(true)
      });
    }
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `README.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl glass-card border border-border/40 shadow-xl mt-4">
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-indigo-400" />
          <h3 className="font-semibold text-sm font-heading text-foreground">AI README Studio</h3>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 rounded-xl px-4 text-xs font-semibold gap-1.5"
        >
          <Sparkles className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? "Generating README..." : (markdown ? "Regenerate" : "Generate README")}
        </Button>
      </div>

      {hasReadme && !markdown && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          This repository currently has a README file. Generating a new README will allow you to preview and overwrite it on GitHub.
        </p>
      )}

      {markdown && (
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-slate-950/80 rounded-xl text-xs max-h-96 overflow-y-auto prose dark:prose-invert max-w-none border border-border/30 shadow-inner font-sans">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
          <div className="flex justify-end gap-2.5">
            <Button onClick={handleDownload} variant="outline" className="text-xs rounded-xl gap-1.5 border-border/50">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              Download .md
            </Button>
            <Button
              onClick={handlePush}
              disabled={isPushing || pushed}
              className={pushed ? "bg-emerald-600 text-white text-xs rounded-xl gap-1.5" : "bg-primary text-primary-foreground text-xs rounded-xl gap-1.5 shadow-md"}
            >
              {pushed ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Committed & Pushed
                </>
              ) : (
                <>
                  <GitPullRequest className="h-3.5 w-3.5" />
                  {isPushing ? "Pushing to GitHub..." : "Push to GitHub"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
