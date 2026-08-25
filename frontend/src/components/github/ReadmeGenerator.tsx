import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGenerateReadme, usePushReadme } from '@/hooks/useGithubRepos';
import { toast } from '@/hooks/useToast';
import ReactMarkdown from 'react-markdown';
import ReactDiffViewer from 'react-diff-viewer-continued';
import {
  Sparkles,
  Download,
  GitPullRequest,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  Code,
  FileDiff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReadmeGenerator({
  repoFullName,
  hasReadme,
  existingReadmeContent = '',
}: {
  repoFullName: string;
  hasReadme: boolean;
  existingReadmeContent?: string;
}) {
  const { mutate: generateReadme, isPending: isGenerating } = useGenerateReadme();
  const { mutate: pushReadme, isPending: isPushing } = usePushReadme();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'source' | 'diff'>('preview');
  const [pushed, setPushed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    toast.ai('Generating Professional README...', `Analyzing file tree and codebase for ${repoFullName}`);
    generateReadme(repoFullName, {
      onSuccess: (data: { readme_markdown: string }) => {
        setMarkdown(data.readme_markdown);
        setPushed(false);
        toast.success('README Generated!', 'Review and customize the README below');
      },
      onError: (err: any) => {
        toast.error('README Generation Failed', err?.message);
      },
    });
  };

  const handlePush = () => {
    if (!markdown) return;
    toast.info('Pushing to GitHub...', `Committing README.md to ${repoFullName}`);
    pushReadme(
      { repoFullName, content: markdown },
      {
        onSuccess: () => {
          setPushed(true);
          toast.success('Committed & Pushed!', `Successfully updated README.md on ${repoFullName}`);
        },
        onError: (err: any) => {
          toast.error('Push Failed', err?.message || 'Check GitHub Personal Access Token permissions');
        },
      }
    );
  };

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success('README Markdown Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoFullName.split('/')[1] || 'README'}-README.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded README.md');
  };

  return (
    <div className="space-y-4 p-5 sm:p-6 rounded-2xl glass-card border border-border/40 shadow-2xl">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm font-heading text-foreground">AI README Studio</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate architecture badges, installation guides, tech stack tables, and code snippets
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-4 h-9 text-xs font-semibold gap-1.5 shrink-0"
        >
          <Sparkles className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Synthesizing README...' : markdown ? 'Regenerate README' : 'Generate README'}
        </Button>
      </div>

      {!markdown && (
        <div className="p-8 text-center text-muted-foreground glass-card rounded-2xl border border-dashed border-border/40 text-xs space-y-3">
          <Sparkles className="h-8 w-8 text-indigo-400/50 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h4 className="font-bold font-heading text-foreground text-sm">
              {hasReadme ? 'Existing README Detected' : 'No README Found in Repository'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {hasReadme
                ? 'Generate a comprehensive, recruiter-ready replacement with badges, installation instructions, and architecture diagrams.'
                : 'Click "Generate README" to automatically inspect the codebase and author a professional README.md.'}
            </p>
          </div>
        </div>
      )}

      {markdown && (
        <div className="space-y-4 animate-fade-in">
          {/* Mode Switcher & Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-secondary/30 border border-border/40 text-xs">
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-border/40 text-[11px]">
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all select-none',
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="h-3 w-3" />
                Formatted Preview
              </button>

              <button
                onClick={() => setActiveTab('source')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all select-none',
                  activeTab === 'source'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Code className="h-3 w-3" />
                Markdown Source
              </button>

              {existingReadmeContent && (
                <button
                  onClick={() => setActiveTab('diff')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all select-none',
                    activeTab === 'diff'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <FileDiff className="h-3 w-3" />
                  Diff View
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="xs"
                onClick={handleCopy}
                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={handleDownload}
                className="h-7 text-[11px] px-2.5 gap-1 border-border/50 text-muted-foreground hover:text-foreground"
              >
                <Download className="h-3 w-3" />
                Download .md
              </Button>
            </div>
          </div>

          {/* Tab 1: Rendered Markdown Preview */}
          {activeTab === 'preview' && (
            <div className="p-5 bg-slate-950/80 rounded-2xl text-xs max-h-[420px] overflow-y-auto prose dark:prose-invert max-w-none border border-border/30 shadow-inner font-sans leading-relaxed">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          )}

          {/* Tab 2: Raw Editable Markdown Source */}
          {activeTab === 'source' && (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-80 p-4 rounded-2xl border border-indigo-500/30 bg-slate-950/90 font-mono text-[11px] text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed shadow-inner"
              spellCheck={false}
            />
          )}

          {/* Tab 3: Side-by-Side Diff */}
          {activeTab === 'diff' && existingReadmeContent && (
            <div className="p-2 bg-slate-950/80 rounded-2xl border border-border/30 text-xs overflow-x-auto max-h-[420px]">
              <ReactDiffViewer
                oldValue={existingReadmeContent}
                newValue={markdown}
                splitView={true}
                hideLineNumbers={false}
                useDarkTheme
              />
            </div>
          )}

          {/* Bottom Push Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                {markdown.split('\n').length} Lines
              </Badge>
              <span className="text-[11px] text-muted-foreground">Ready to deploy to master branch</span>
            </div>

            <Button
              onClick={handlePush}
              disabled={isPushing || pushed}
              className={cn(
                'h-9 text-xs font-bold rounded-xl gap-2 shadow-lg transition-all',
                pushed
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              )}
            >
              {pushed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Committed & Pushed to GitHub
                </>
              ) : (
                <>
                  <GitPullRequest className={`h-4 w-4 ${isPushing ? 'animate-spin' : ''}`} />
                  {isPushing ? 'Committing to GitHub...' : 'Commit & Push to GitHub'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
