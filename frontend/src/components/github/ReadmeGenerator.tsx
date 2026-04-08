import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGenerateReadme, usePushReadme } from '@/hooks/useGithubRepos';
import ReactMarkdown from 'react-markdown';

export function ReadmeGenerator({ repoFullName, hasReadme }: { repoFullName: string, hasReadme: boolean }) {
  const { mutate: generateReadme, isPending: isGenerating } = useGenerateReadme();
  const { mutate: pushReadme, isPending: isPushing } = usePushReadme();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [pushed, setPushed] = useState(false);

  const handleGenerate = () => {
    generateReadme(repoFullName, {
      onSuccess: (data) => {
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
    <div className="space-y-4 p-4 border rounded-md bg-card mt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">README Generator</h3>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Generating..." : (markdown ? "Regenerate" : "Generate README")}
        </Button>
      </div>

      {hasReadme && !markdown && (
        <p className="text-sm text-muted-foreground">This repository already has a README. You can generate a new one to overwrite it.</p>
      )}

      {markdown && (
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-muted rounded-md text-sm max-h-96 overflow-y-auto prose dark:prose-invert max-w-none">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={handleDownload} variant="outline">
              Download README
            </Button>
            <Button onClick={handlePush} disabled={isPushing || pushed} variant={pushed ? "secondary" : "default"}>
              {isPushing ? "Pushing..." : (pushed ? "Pushed Successfully!" : "Push to GitHub")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
